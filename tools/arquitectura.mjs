#!/usr/bin/env node
/*
 * Modelo de arquitectura de SAHS (lo dibuja apps/arquitectura).
 *
 *   node tools/arquitectura.mjs generar     lee el código y escribe apps/arquitectura/modelo/generado.json
 *   node tools/arquitectura.mjs verificar   lista las diferencias con validado.json; sale con 1 si hay alguna
 *   node tools/arquitectura.mjs validar     pregunta una por una qué diferencias se aprueban y las pasa a validado.json
 *                               [--todo]    aprueba todas sin preguntar
 *
 * Del código salen los servicios y contenedores (docker-compose.yml), las llamadas entre
 * servicios (new ClienteServicio('x') en apps/<servicio>/src) y las tablas de cada servicio
 * (@Entity('...') en libs/entidades/src/<servicio>). validado.json lo aprueba una persona:
 * un agente de IA no corre `validar`.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { aplicar, diferencias } from '../apps/arquitectura/modelo/diferencias.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELO = path.join(RAIZ, 'apps/arquitectura/modelo');
const GENERADO = path.join(MODELO, 'generado.json');
const VALIDADO = path.join(MODELO, 'validado.json');

/** Servicios del compose: nombre, y los args APP y ENTRADA del build si los tiene. */
function leerCompose() {
  const lineas = fs.readFileSync(path.join(RAIZ, 'docker-compose.yml'), 'utf8').split('\n');
  const servicios = [];
  let dentro = false;
  let actual = null;
  for (const linea of lineas) {
    if (/^\S/.test(linea)) {
      dentro = /^services:\s*$/.test(linea);
      actual = null;
      continue;
    }
    if (!dentro || /^\s*#/.test(linea)) continue;
    const nombre = linea.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (nombre) {
      actual = { nombre: nombre[1], app: null, entrada: null };
      servicios.push(actual);
      continue;
    }
    if (!actual) continue;
    const app = linea.match(/\bAPP:\s*([A-Za-z0-9_-]+)/);
    if (app) actual.app = app[1];
    const entrada = linea.match(/\bENTRADA:\s*([A-Za-z0-9_.-]+)/);
    if (entrada) actual.entrada = entrada[1];
  }
  return servicios;
}

function archivos(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return archivos(p, ext);
    return e.name.endsWith(ext) && !e.name.endsWith('.spec.ts') ? [p] : [];
  });
}

function buscar(dir, regex) {
  const encontrados = new Set();
  for (const archivo of archivos(dir, '.ts')) {
    for (const m of fs.readFileSync(archivo, 'utf8').matchAll(regex)) encontrados.add(m[1]);
  }
  return [...encontrados].sort();
}

export function generar() {
  const compose = leerCompose();
  const ids = compose.filter((s) => s.app && !s.entrada).map((s) => s.app);
  const servicios = ids.map((id) => ({
    id,
    tablas: buscar(path.join(RAIZ, 'libs/entidades/src', id), /@Entity\(\s*'([^']+)'/g),
  }));
  const llamadas = ids
    .flatMap((de) =>
      buscar(path.join(RAIZ, 'apps', de, 'src'), /new ClienteServicio\(\s*'([a-z_]+)'/g)
        .map((a) => a.replace(/_/g, '-'))
        .filter((a) => a !== de)
        .map((a) => ({ de, a })),
    )
    .sort((x, y) => `${x.de}>${x.a}`.localeCompare(`${y.de}>${y.a}`));
  const contenedores = compose.map((s) => s.nombre).sort();
  return { generado: new Date().toISOString(), servicios, llamadas, contenedores };
}

function leer(archivo) {
  return JSON.parse(fs.readFileSync(archivo, 'utf8'));
}

function escribir(archivo, datos) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify(datos, null, 2) + '\n');
}

const SIGNO = { nuevo: '+', eliminado: '−', cambiado: '~' };
const mostrar = (d) => `${SIGNO[d.cambio]} ${d.tipo} ${d.cambio}: ${d.descripcion}  (${d.origen})`;

async function validar(todo) {
  const generado = generar();
  escribir(GENERADO, generado);
  let validado = leer(VALIDADO);
  const lista = diferencias(generado, validado);
  if (!lista.length) {
    console.log('El modelo validado ya coincide con el código.');
    return;
  }
  if (!todo && !process.stdin.isTTY) {
    console.error('validar pregunta en la terminal; sin terminal, usá --todo.');
    process.exit(2);
  }
  const rl = todo ? null : readline.createInterface({ input: process.stdin, output: process.stdout });
  let aprobadas = 0;
  for (const d of lista) {
    const si = todo || /^s/i.test((await rl.question(`${mostrar(d)}\n  ¿Aprobar? [s/N] `)).trim());
    if (si) {
      validado = aplicar(validado, d, generado);
      aprobadas++;
    }
  }
  rl?.close();
  if (!aprobadas) {
    console.log('No se aprobó nada; validado.json queda igual.');
    return;
  }
  validado.validado = new Date().toISOString().slice(0, 10);
  validado.servicios.sort((a, b) => a.id.localeCompare(b.id));
  validado.llamadas.sort((x, y) => `${x.de}>${x.a}`.localeCompare(`${y.de}>${y.a}`));
  validado.contenedores.sort();
  escribir(VALIDADO, validado);
  console.log(`Aprobadas ${aprobadas} de ${lista.length}. Revisá apps/arquitectura/modelo/validado.json y hacé commit.`);
  if (validado.servicios.some((s) => !s.descripcion)) {
    console.log('Hay servicios sin descripción: completá nombre, descripción e ícono en validado.json.');
  }
}

const [comando = 'verificar', ...resto] = process.argv.slice(2);
if (comando === 'generar') {
  escribir(GENERADO, generar());
  console.log(`Modelo generado en ${path.relative(RAIZ, GENERADO)}`);
} else if (comando === 'verificar') {
  const lista = diferencias(generar(), leer(VALIDADO));
  if (lista.length) {
    console.log(`Hay ${lista.length} diferencia(s) entre el código y el modelo validado:`);
    for (const d of lista) console.log(`  ${mostrar(d)}`);
    console.log('Las aprueba una persona con: npm run arquitectura:validar');
    process.exit(1);
  }
  console.log('El modelo validado coincide con el código.');
} else if (comando === 'validar') {
  await validar(resto.includes('--todo'));
} else {
  console.error(`Comando desconocido: ${comando}. Usá generar, verificar o validar.`);
  process.exit(2);
}
