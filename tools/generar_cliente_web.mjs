#!/usr/bin/env node
/*
 * Genera el cliente tipado de la API para la web (apps/web/src/api/<servicio>.ts) a
 * partir del OpenAPI que publica cada servicio (/docs-json), que es la fuente de verdad.
 * Los tipos salen de @sahs/contratos (mismo nombre que el schema; bodies: <Op>Body,
 * queries: <Op>Query).
 *
 * Uso (con los servicios levantados en sus puertos de desarrollo 8081 a 8086):
 *   node tools/generar_cliente_web.mjs
 *   node tools/generar_cliente_web.mjs --url http://localhost:8100/docs   (a través del proxy de la web)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVICIOS = [
  ['usuario', 8081],
  ['pago', 8082],
  ['horarios', 8083],
  ['planificacion', 8084],
  ['orientacion', 8085],
  ['profesor_suplencias', 8086],
];
const iUrl = process.argv.indexOf('--url');
const BASE_PROXY = iUrl > 0 ? process.argv[iUrl + 1] : null;

const pascal = (s) => s.split(/[^a-zA-Z0-9]+/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const camel = (s) => s.replace(/_(\w)/g, (_, c) => c.toUpperCase());
const NOMBRE_SCHEMA = { Error: 'ErrorApi' };

function tipoRespuesta(op) {
  const ok = Object.entries(op.responses).find(([c]) => c.startsWith('2'));
  if (!ok) return 'void';
  const [, r] = ok;
  const c = r.content || {};
  if (c['application/pdf']) return 'Blob';
  const s = c['application/json']?.schema;
  if (!s) return 'void';
  const ref = (x) => x.$ref?.split('/').pop();
  if (s.$ref) return NOMBRE_SCHEMA[ref(s)] ?? ref(s);
  if (s.type === 'array' && s.items.$ref) return `${NOMBRE_SCHEMA[ref(s.items)] ?? ref(s.items)}[]`;
  return 'unknown';
}

async function main() {
  const indice = [];
  for (const [svc, puerto] of SERVICIOS) {
    const url = BASE_PROXY ? `${BASE_PROXY}/${svc}-json` : `http://localhost:${puerto}/docs-json`;
    const doc = await (await fetch(url)).json();
    const tipos = new Set();
    const funciones = [];
    for (const [ruta, metodos] of Object.entries(doc.paths)) {
      if (!ruta.startsWith(`/${svc}/`)) continue;
      for (const [metodo, op] of Object.entries(metodos)) {
        const params = (op.parameters || []).filter((p) => p.in === 'path');
        const query = (op.parameters || []).filter((p) => p.in === 'query');
        const conBody = !!op.requestBody;
        const ret = tipoRespuesta(op);
        for (const t of ret.replace('[]', '').split('|')) if (!['void', 'Blob', 'unknown'].includes(t)) tipos.add(t);
        const args = params.map((p) => `${camel(p.name)}: number`);
        const nombreBody = pascal(op.operationId) + 'Body';
        const nombreQuery = pascal(op.operationId) + 'Query';
        if (conBody) {
          tipos.add(nombreBody);
          args.push(`body: ${nombreBody}`);
        }
        if (query.length) {
          tipos.add(nombreQuery);
          const opcional = query.every((q) => !q.required);
          args.push(`query${opcional ? '?' : ''}: ${nombreQuery}`);
        }
        const rutaTs = '`' + ruta.replace(/\{(\w+)\}/g, (_, n) => '${' + camel(n) + '}') + '`';
        const opciones = [`metodo: '${metodo.toUpperCase()}'`];
        if (conBody) opciones.push('body');
        if (query.length) opciones.push('query');
        if (ret === 'Blob') opciones.push("tipo: 'blob'");
        const doc_ = [op.summary, op.description].filter(Boolean).join('. ').replace(/\*\//g, '').split('\n')[0];
        funciones.push(
          `  /** ${metodo.toUpperCase()} ${ruta} — ${doc_} */\n` +
            `  ${op.operationId}: (${args.join(', ')}) =>\n` +
            `    pedir<${ret}>(${rutaTs}, { ${opciones.join(', ')} }),`,
        );
      }
    }
    const nombre = camel(svc);
    const texto = [
      '// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.',
      `import type { ${[...tipos].sort().join(', ')} } from '@sahs/contratos';`,
      "import { pedir } from './http';",
      '',
      `/** Servicio ${doc.info.title}. */`,
      `export const ${nombre} = {`,
      funciones.join('\n'),
      '};',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(RAIZ, 'apps/web/src/api', `${svc.replace('_', '-')}.ts`), texto);
    indice.push(`export { ${nombre} } from './${svc.replace('_', '-')}';`);
    console.log(`${svc}: ${funciones.length} funciones`);
  }
  fs.writeFileSync(
    path.join(RAIZ, 'apps/web/src/api/index.ts'),
    '// Generado por tools/generar_cliente_web.mjs. No editar a mano.\n' + indice.join('\n') + "\nexport { ApiError, pedir } from './http';\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
