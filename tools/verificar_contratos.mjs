#!/usr/bin/env node
/*
 * Verifica el corte: compara el OpenAPI que publica cada servicio NestJS (/docs-json)
 * con el contrato congelado specs/<servicio>.json.
 *
 * Compara rutas, verbos, operationId, códigos de respuesta, parámetros (nombre, lugar,
 * obligatorio) y las propiedades y los obligatorios de los bodies y de las respuestas.
 *
 * Uso:
 *   npm run build && npm run verificar-contratos
 *   node tools/verificar_contratos.mjs --url usuario=http://localhost:8081   (servicio ya levantado)
 *
 * Termina con código 1 si encuentra diferencias.
 */
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVICIOS = [
  { spec: 'usuario', app: 'usuario', puerto: 9181 },
  { spec: 'pago', app: 'pago', puerto: 9182 },
  { spec: 'horarios', app: 'horarios', puerto: 9183 },
  { spec: 'planificacion', app: 'planificacion', puerto: 9184 },
  { spec: 'orientacion', app: 'orientacion', puerto: 9185 },
  { spec: 'profesor_suplencias', app: 'profesor-suplencias', puerto: 9186 },
];

/**
 * Diferencias aceptadas a propósito (documentadas en el README, "Cambios respecto del documento"):
 * operaciones agregadas y los códigos 409 y 503, que el contrato original no tenía.
 */
const AGREGADOS = new Set(['PUT /planificacion/editar_clase/{id}', 'DELETE /planificacion/eliminar_clase/{id}']);
const CODIGOS_AGREGADOS = ['409', '503'];

const urlsDadas = Object.fromEntries(
  process.argv.filter((a, i) => process.argv[i - 1] === '--url').map((a) => a.split('=')),
);

/* ---------- normalización de schemas ---------- */

function resolver(doc, s, vistos = new Set()) {
  if (!s) return s;
  if (s.$ref) {
    const n = s.$ref.split('/').pop();
    if (vistos.has(n)) return { $ciclo: n };
    return resolver(doc, doc.components.schemas[n], new Set([...vistos, n]));
  }
  if (s.allOf && s.allOf.length === 1) return resolver(doc, { ...s.allOf[0] }, vistos);
  return s;
}

/** Firma de un schema: tipo, propiedades, obligatorios (hasta 3 niveles). */
function firma(doc, s, nivel = 0, vistos = new Set()) {
  s = resolver(doc, s, vistos);
  if (!s) return null;
  if (s.$ciclo) return { ref: s.$ciclo };
  if (s.type === 'array') return { array: firma(doc, s.items, nivel + 1, vistos) };
  if (s.properties || s.type === 'object') {
    if (nivel > 3) return { objeto: true };
    const props = {};
    for (const [k, v] of Object.entries(s.properties || {})) props[k] = firma(doc, v, nivel + 1, vistos);
    return { props, required: [...(s.required || [])].sort() };
  }
  const t = s.type === 'number' || s.type === 'integer' ? 'numero' : s.type;
  return { tipo: t || 'cualquiera' };
}

function comparar(a, b, ruta, difs) {
  if (a === null || b === null) {
    if (a !== b) difs.push(`${ruta}: uno tiene schema y el otro no`);
    return;
  }
  if (a.ref || b.ref) return;
  if (a.array || b.array) {
    if (!a.array || !b.array) difs.push(`${ruta}: array vs no array`);
    else comparar(a.array, b.array, ruta + '[]', difs);
    return;
  }
  if (a.props || b.props) {
    if (!a.props || !b.props) {
      if (!(a.objeto || b.objeto)) difs.push(`${ruta}: objeto vs no objeto`);
      return;
    }
    const ka = Object.keys(a.props), kb = Object.keys(b.props);
    for (const k of ka) if (!kb.includes(k)) difs.push(`${ruta}.${k}: falta en el servicio`);
    for (const k of kb) if (!ka.includes(k)) difs.push(`${ruta}.${k}: sobra en el servicio`);
    const ra = a.required.join(','), rb = b.required.join(',');
    if (ra !== rb) difs.push(`${ruta}: obligatorios distintos (contrato: [${ra}], servicio: [${rb}])`);
    for (const k of ka) if (kb.includes(k)) comparar(a.props[k], b.props[k], `${ruta}.${k}`, difs);
    return;
  }
  if (a.tipo && b.tipo && a.tipo !== b.tipo && a.tipo !== 'cualquiera' && b.tipo !== 'cualquiera') {
    difs.push(`${ruta}: tipo ${a.tipo} en el contrato, ${b.tipo} en el servicio`);
  }
}

function operaciones(doc) {
  const out = new Map();
  for (const [ruta, metodos] of Object.entries(doc.paths || {})) {
    for (const [m, op] of Object.entries(metodos)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(m)) continue;
      out.set(`${m.toUpperCase()} ${ruta}`, op);
    }
  }
  return out;
}

function compararDocs(contrato, servicio) {
  const difs = [];
  const oc = operaciones(contrato), os_ = operaciones(servicio);
  for (const k of oc.keys()) if (!os_.has(k)) difs.push(`${k}: falta en el servicio`);
  for (const k of os_.keys()) if (!oc.has(k) && !AGREGADOS.has(k)) difs.push(`${k}: sobra en el servicio`);
  for (const [k, a] of oc) {
    const b = os_.get(k);
    if (!b) continue;
    if (k.endsWith('/actuator/health')) continue;
    if (a.operationId !== b.operationId) difs.push(`${k}: operationId ${a.operationId} vs ${b.operationId}`);
    const ca = Object.keys(a.responses).sort().join(','), cb = Object.keys(b.responses).filter((c) => !CODIGOS_AGREGADOS.includes(c)).sort().join(',');
    if (ca !== cb) difs.push(`${k}: códigos [${ca}] en el contrato, [${cb}] en el servicio`);
    const pa = (a.parameters || []).map((p) => `${p.in}:${p.name}:${!!p.required}`).sort().join(' ');
    const pb = (b.parameters || []).map((p) => `${p.in}:${p.name}:${!!p.required}`).sort().join(' ');
    if (pa !== pb) difs.push(`${k}: parámetros [${pa}] vs [${pb}]`);
    const ba = a.requestBody?.content?.['application/json']?.schema;
    const bb = b.requestBody?.content?.['application/json']?.schema;
    comparar(ba ? firma(contrato, ba) : null, bb ? firma(servicio, bb) : null, `${k} body`, difs);
    for (const c of Object.keys(a.responses)) {
      const deref = (doc, r) => (r && r.$ref ? doc.components.responses[r.$ref.split('/').pop()] : r);
      const ra = deref(contrato, a.responses[c]), rb = deref(servicio, b.responses[c]);
      if (!rb) continue;
      const tipos = Object.keys(ra.content || {});
      const tiposB = Object.keys(rb.content || {});
      if (tipos.join() !== tiposB.join()) difs.push(`${k} ${c}: content-type [${tipos}] vs [${tiposB}]`);
      if (tipos[0] === 'application/json') {
        comparar(firma(contrato, ra.content[tipos[0]].schema), firma(servicio, rb.content[tiposB[0]]?.schema), `${k} ${c}`, difs);
      }
    }
  }
  return difs;
}

/* ---------- levantar servicios ---------- */

async function esperar(url, ms = 20000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* todavía no */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`No respondió ${url}`);
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sahs-verificar-'));
  const db = path.join(tmp, 'sahs.sqlite');
  const procesos = [];
  let total = 0;
  try {
    if (Object.keys(urlsDadas).length < SERVICIOS.length) {
      execFileSync('node', [path.join(RAIZ, 'apps/db/dist/db-init.js')], { env: { ...process.env, DB_PATH: db, SIN_SEEDS: '1' }, stdio: 'ignore' });
    }
    for (const s of SERVICIOS) {
      if (urlsDadas[s.spec]) continue;
      const p = spawn('node', [path.join(RAIZ, `apps/${s.app}/dist/main.js`)], {
        env: { ...process.env, DB_PATH: db, PORT: String(s.puerto) },
        stdio: 'ignore',
      });
      procesos.push(p);
      urlsDadas[s.spec] = `http://localhost:${s.puerto}`;
    }
    for (const s of SERVICIOS) {
      const base = urlsDadas[s.spec];
      await esperar(`${base}/actuator/health`);
      const servicio = await (await fetch(`${base}/docs-json`)).json();
      const contrato = JSON.parse(fs.readFileSync(path.join(RAIZ, 'specs', s.spec + '.json'), 'utf8'));
      const difs = compararDocs(contrato, servicio);
      total += difs.length;
      console.log(`${difs.length ? '✗' : '✓'} ${s.spec}: ${operaciones(servicio).size} operaciones, ${difs.length} diferencias`);
      for (const d of difs) console.log('    ' + d);
    }
  } finally {
    for (const p of procesos) p.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(total ? `\n${total} diferencias con los contratos congelados.` : '\nSin diferencias con los contratos congelados.');
  process.exit(total ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
