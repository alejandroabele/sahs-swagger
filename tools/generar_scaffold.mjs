#!/usr/bin/env node
/*
 * Scaffolding de los microservicios a partir de los contratos congelados (specs/*.json).
 *
 * Se corrió UNA vez para crear el código inicial. Desde entonces el código Nest es
 * la fuente de verdad y este script queda como historial, igual que generar_specs.py.
 *
 * Genera:
 *   libs/contratos/src/<servicio>.ts            interfaces de los schemas y de los bodies
 *   apps/<app>/src/dto/modelos.ts               clases de respuesta con @ApiProperty
 *   apps/<app>/src/dto/entradas.ts              bodies y queries con class-validator
 *   apps/<app>/src/<tag>/<tag>.controller.ts    rutas, verbos, códigos y swagger
 *   apps/<app>/src/<tag>/<tag>.service.ts       métodos vacíos (solo si el archivo no existe)
 *   apps/<app>/src/swagger.ts                   info del documento y x-dependencias
 *
 * Uso:  node tools/generar_scaffold.mjs --forzar [--forzar-services]
 *       (sin --forzar no corre si las apps ya existen, para no pisar el código editado a mano)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORZAR_SERVICES = process.argv.includes('--forzar-services');

export const SERVICIOS = [
  { spec: 'usuario', app: 'usuario', prefijo: 'usuario', clase: 'Usuario' },
  { spec: 'pago', app: 'pago', prefijo: 'pago', clase: 'Pago' },
  { spec: 'horarios', app: 'horarios', prefijo: 'horarios', clase: 'Horarios' },
  { spec: 'planificacion', app: 'planificacion', prefijo: 'planificacion', clase: 'Planificacion' },
  { spec: 'orientacion', app: 'orientacion', prefijo: 'orientacion', clase: 'Orientacion' },
  { spec: 'profesor_suplencias', app: 'profesor-suplencias', prefijo: 'profesor_suplencias', clase: 'ProfesorSuplencias' },
];

/* ---------- utilidades de nombres ---------- */

const sinTildes = (s) => s.replace(/ñ/g, 'ni').replace(/Ñ/g, 'Ni').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const pascal = (s) => sinTildes(s).split(/[^a-zA-Z0-9]+/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const kebab = (s) => sinTildes(s).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).join('-');
const refNombre = (ref) => ref.split('/').pop();
const js = (v) => JSON.stringify(v);

function escribir(rel, contenido) {
  const abs = path.join(RAIZ, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contenido);
}

/* ---------- schemas → TypeScript ---------- */

// Devuelve { ref, nullable } si el schema es una referencia (directa o con allOf).
function comoRef(s) {
  if (!s) return null;
  if (s.$ref) return { ref: refNombre(s.$ref), nullable: !!s.nullable };
  if (s.allOf && s.allOf.length === 1 && s.allOf[0].$ref) return { ref: refNombre(s.allOf[0].$ref), nullable: !!s.nullable };
  return null;
}

function tipoTs(s) {
  const r = comoRef(s);
  if (r) return r.ref + (r.nullable ? ' | null' : '');
  if (s.type === 'array') return `${envolver(tipoTs(s.items))}[]`;
  let t;
  if (s.enum) t = s.enum.map((e) => js(e)).join(' | ');
  else if (s.type === 'integer' || s.type === 'number') t = 'number';
  else if (s.type === 'boolean') t = 'boolean';
  else if (s.type === 'string') t = 'string';
  else if (s.type === 'object' && s.properties) t = '{ ' + Object.entries(s.properties).map(([k, v]) => `${k}${(s.required || []).includes(k) ? '' : '?'}: ${tipoTs(v)}`).join('; ') + ' }';
  else t = 'unknown';
  return t + (s.nullable ? ' | null' : '');
}
const envolver = (t) => (t.includes('|') ? `(${t})` : t);

function interfaz(nombre, s, doc) {
  const req = s.required || [];
  const lineas = [];
  if (doc) lineas.push(`/** ${doc} */`);
  lineas.push(`export interface ${nombre} {`);
  for (const [k, v] of Object.entries(s.properties || {})) {
    if (v.description) lineas.push(`  /** ${v.description.replace(/\*\//g, '')} */`);
    const ro = v.readOnly ? 'readonly ' : '';
    lineas.push(`  ${ro}${k}${req.includes(k) ? '' : '?'}: ${tipoTs(v)};`);
  }
  lineas.push('}');
  return lineas.join('\n');
}

/* ---------- operaciones ---------- */

function operaciones(spec) {
  const ops = [];
  for (const [ruta, metodos] of Object.entries(spec.paths)) {
    for (const [metodo, op] of Object.entries(metodos)) {
      if (ruta === '/actuator/health') continue;
      const params = op.parameters || [];
      const body = op.requestBody?.content?.['application/json']?.schema || null;
      const exitos = Object.entries(op.responses).filter(([c]) => c.startsWith('2'));
      const [codigo, resp] = exitos[0];
      const contenido = resp.content || {};
      const tipoContenido = Object.keys(contenido)[0] || null;
      const esquemaResp = tipoContenido ? contenido[tipoContenido].schema : null;
      const errores = Object.keys(op.responses).filter((c) => !c.startsWith('2'));
      ops.push({
        ruta, metodo, op, nombre: op.operationId, tag: op.tags[0],
        pathParams: params.filter((p) => p.in === 'path'),
        queryParams: params.filter((p) => p.in === 'query'),
        body, codigo: Number(codigo), descResp: resp.description, tipoContenido, esquemaResp, errores,
      });
    }
  }
  return ops;
}

/* ---------- @ApiProperty y class-validator ---------- */

function opcionesApi(s, requerido) {
  const o = {};
  const r = comoRef(s);
  let tipoExpr = null;
  if (r) {
    tipoExpr = `() => ${r.ref}`;
    if (r.nullable) o.nullable = true;
  } else if (s.type === 'array') {
    const ri = comoRef(s.items);
    if (ri) tipoExpr = `() => [${ri.ref}]`;
    else { o.type = s.items.type; if (s.items.format) o.format = s.items.format; o.isArray = true; }
  } else {
    if (s.type) o.type = s.type;
    if (s.format) o.format = s.format;
    if (s.enum) o.enum = s.enum;
    if (s.nullable) o.nullable = true;
  }
  if (s.description) o.description = s.description;
  if (s.example !== undefined) o.example = s.example;
  if (s.readOnly) o.readOnly = true;
  if (s.writeOnly) o.writeOnly = true;
  o.required = !!requerido;
  let txt = js(o);
  if (tipoExpr) txt = txt.replace(/^\{/, `{ type: ${tipoExpr},`).replace(/,}$/, ' }');
  return txt;
}

function validadores(s, requerido, nombreOp, campo, usados) {
  const v = [];
  const usar = (d) => { usados.add(d.replace(/\(.*$/s, '')); v.push(`@${d}`); };
  if (!requerido) usar('IsOptional()');
  else if (s.nullable) { usados.add('ValidateIf'); v.push(`@ValidateIf((o) => o.${campo} !== null)`); }
  if (s.type === 'integer') { usar('Type(() => Number)'); usar('IsInt()'); }
  else if (s.type === 'number') { usar('Type(() => Number)'); usar('IsNumber()'); }
  else if (s.type === 'boolean') usar('IsBoolean()');
  else if (s.type === 'array') {
    usar('IsArray()');
    if (s.items.type === 'integer') { usar('IsInt({ each: true })'); }
    else if (s.items.type === 'string') usar('IsString({ each: true })');
  } else if (s.type === 'string') {
    if (s.format === 'email' && nombreOp !== 'login') usar('IsEmail()');
    else if (s.format === 'date' || s.format === 'date-time') usar('IsDateString()');
    else usar('IsString()');
    if (requerido && !s.nullable) usar('IsNotEmpty()');
    if (s.pattern) usar(`Matches(/${s.pattern}/)`);
  }
  if (s.enum) usar(`IsIn(${js(s.enum)})`);
  return v;
}

/* ---------- generación por servicio ---------- */

const COMPARTIDOS = new Map(); // nombre de schema → definición (los que aparecen en varios contratos)

function generarContratos(todos) {
  const conteo = new Map();
  for (const { spec } of todos) for (const n of Object.keys(spec.components.schemas)) conteo.set(n, (conteo.get(n) || 0) + 1);
  for (const { spec } of todos) {
    for (const [n, s] of Object.entries(spec.components.schemas)) if (conteo.get(n) > 1) COMPARTIDOS.set(n, s);
  }
  const cab = '// Generado por tools/generar_scaffold.mjs a partir de specs/*.json (corte inicial).\n// Desde el corte, este archivo se mantiene a mano junto con los DTOs de cada servicio.\n';
  escribir('libs/contratos/src/compartidos.ts', cab + '\n' + [...COMPARTIDOS].map(([n, s]) => interfaz(n === 'Error' ? 'ErrorApi' : n, s, n === 'Error' ? 'Cuerpo de toda respuesta de error' : s.description)).join('\n\n') + '\n');

  const exportados = ['compartidos'];
  for (const { svc, spec } of todos) {
    const partes = [];
    const usadosCompartidos = new Set();
    const cuerpo = [];
    for (const [n, s] of Object.entries(spec.components.schemas)) {
      if (COMPARTIDOS.has(n)) continue;
      cuerpo.push(interfaz(n, s, s.description));
    }
    for (const o of operaciones(spec)) {
      if (o.body) cuerpo.push(interfaz(pascal(o.nombre) + 'Body', o.body, `Body de ${o.metodo.toUpperCase()} ${o.ruta}`));
      if (o.queryParams.length) {
        const s = { type: 'object', properties: Object.fromEntries(o.queryParams.map((p) => [p.name, { ...p.schema, description: p.description }])), required: o.queryParams.filter((p) => p.required).map((p) => p.name) };
        cuerpo.push(interfaz(pascal(o.nombre) + 'Query', s, `Query de GET ${o.ruta}`));
      }
    }
    const texto = cuerpo.join('\n\n');
    for (const n of COMPARTIDOS.keys()) if (new RegExp(`\\b${n}\\b`).test(texto)) usadosCompartidos.add(n);
    if (usadosCompartidos.size) partes.push(`import type { ${[...usadosCompartidos].join(', ')} } from './compartidos';\n`);
    partes.push(texto);
    escribir(`libs/contratos/src/${svc.app}.ts`, cab + (partes.length ? '\n' : '') + partes.join('\n') + '\n');
    exportados.push(svc.app);
  }
  escribir('libs/contratos/src/index.ts', cab + '\n' + exportados.map((e) => `export * from './${e}';`).join('\n') + '\n');
}

function generarModelos(svc, spec) {
  const usadosVal = new Set();
  const lineas = [];
  const schemas = Object.entries(spec.components.schemas).filter(([n]) => n !== 'Error' && n !== 'Health');
  // Orden: primero los que no referencian a otros, para que las clases existan al decorar.
  const orden = [];
  const pendientes = new Map(schemas);
  while (pendientes.size) {
    let avanzo = false;
    for (const [n, s] of pendientes) {
      const refs = JSON.stringify(s).match(/#\/components\/schemas\/(\w+)/g) || [];
      const deps = refs.map(refNombre).filter((r) => r !== n && pendientes.has(r));
      if (!deps.length) { orden.push([n, s]); pendientes.delete(n); avanzo = true; }
    }
    if (!avanzo) { for (const e of pendientes) orden.push(e); break; }
  }
  for (const [n, s] of orden) {
    if (s.description) lineas.push(`/** ${s.description} */`);
    lineas.push(`@ApiSchema({ name: ${js(n)} })`);
    lineas.push(`export class ${n} implements C.${n} {`);
    for (const [k, v] of Object.entries(s.properties || {})) {
      const req = (s.required || []).includes(k);
      lineas.push(`  @ApiProperty(${opcionesApi(v, req)})`);
      lineas.push(`  ${k}${req ? '!' : '?'}: ${tipoTsModelo(v)};`);
    }
    lineas.push('}', '');
  }
  const cab = [
    '// Modelos de respuesta del servicio (schemas del swagger).',
    '// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.',
    "import { ApiProperty, ApiSchema } from '@nestjs/swagger';",
    "import type * as C from '@sahs/contratos';",
    '',
  ];
  return cab.join('\n') + lineas.join('\n');
}
// En las clases, los tipos referencian a las clases locales (mismo nombre que la interfaz).
const tipoTsModelo = (s) => tipoTs(s);

function generarEntradas(svc, ops) {
  const usados = new Set();
  const clases = [];
  for (const o of ops) {
    const grupos = [];
    if (o.body) grupos.push([pascal(o.nombre) + 'Dto', o.body, `Body de ${o.metodo.toUpperCase()} ${o.ruta}`]);
    if (o.queryParams.length) {
      grupos.push([pascal(o.nombre) + 'Query', {
        type: 'object',
        properties: Object.fromEntries(o.queryParams.map((p) => [p.name, { ...p.schema, description: p.description }])),
        required: o.queryParams.filter((p) => p.required).map((p) => p.name),
      }, `Query de GET ${o.ruta}`]);
    }
    for (const [nombre, s, doc] of grupos) {
      const contrato = nombre.endsWith('Dto') ? nombre.replace(/Dto$/, 'Body') : nombre;
      clases.push(`/** ${doc} */`);
      clases.push(`export class ${nombre} implements C.${contrato} {`);
      for (const [k, v] of Object.entries(s.properties || {})) {
        const req = (s.required || []).includes(k);
        clases.push(`  @ApiProperty(${opcionesApi(v, req)})`);
        for (const d of validadores(v, req, o.nombre, k, usados)) clases.push(`  ${d}`);
        clases.push(`  ${k}${req ? '!' : '?'}: ${tipoTs(v)};`);
      }
      clases.push('}', '');
    }
  }
  const cv = [...usados].filter((u) => u !== 'Type');
  const cab = [
    '// Bodies y queries de entrada, con validación (class-validator) y swagger.',
    '// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.',
    "import { ApiProperty } from '@nestjs/swagger';",
    usados.has('Type') ? "import { Type } from 'class-transformer';" : null,
    cv.length ? `import { ${cv.sort().join(', ')} } from 'class-validator';` : null,
    "import type * as C from '@sahs/contratos';",
    '',
  ].filter((l) => l !== null);
  return cab.join('\n') + clases.join('\n');
}

const DECORADOR_METODO = { get: 'Get', post: 'Post', put: 'Put', patch: 'Patch', delete: 'Delete' };
const CODIGO_POR_DEFECTO = { get: 200, post: 201, put: 200, patch: 200, delete: 200 };

function tipoRespuestaApi(s) {
  if (!s) return null;
  const r = comoRef(s);
  if (r) return r.ref;
  if (s.type === 'array') { const ri = comoRef(s.items); if (ri) return `[${ri.ref}]`; }
  return null;
}
function tipoRespuestaTs(s) {
  if (!s) return 'void';
  const r = comoRef(s);
  if (r) return r.ref;
  if (s.type === 'array') { const ri = comoRef(s.items); if (ri) return `${ri.ref}[]`; }
  return 'unknown';
}

function generarControllerYService(svc, spec, tag, ops) {
  const slug = kebab(tag);
  const Clase = pascal(tag);
  const modelos = new Set();
  const entradas = new Set();
  const swaggerDec = new Set(['ApiTags', 'ApiOperation', 'ApiResponse']);
  const nestDec = new Set(['Controller']);
  const metodosCtrl = [];
  const metodosSrv = [];

  for (const o of ops) {
    const rutaRel = o.ruta.replace(`/${svc.prefijo}/`, '').replace(/\{(\w+)\}/g, ':$1');
    const dec = DECORADOR_METODO[o.metodo];
    nestDec.add(dec);
    const d = [];
    d.push(`  @${dec}(${js(rutaRel)})`);
    if (o.codigo !== CODIGO_POR_DEFECTO[o.metodo]) { nestDec.add('HttpCode'); d.push(`  @HttpCode(${o.codigo})`); }
    const opOps = { operationId: o.nombre, summary: o.op.summary };
    if (o.op.description) opOps.description = o.op.description;
    d.push(`  @ApiOperation(${js(opOps)})`);
    for (const p of o.pathParams) {
      swaggerDec.add('ApiParam');
      d.push(`  @ApiParam(${js({ name: p.name, description: p.description, type: 'integer', format: 'int64' })})`);
    }
    // Respuesta OK
    const tr = tipoRespuestaApi(o.esquemaResp);
    if (tr) for (const m of tr.replace(/[[\]]/g, '').split(',')) modelos.add(m);
    if (o.tipoContenido === 'application/pdf') {
      d.push(`  @ApiResponse({ status: ${o.codigo}, description: ${js(o.descResp)}, content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } })`);
    } else if (tr) d.push(`  @ApiResponse({ status: ${o.codigo}, description: ${js(o.descResp)}, type: ${tr} })`);
    else d.push(`  @ApiResponse({ status: ${o.codigo}, description: ${js(o.descResp)} })`);
    if (o.errores.includes('400')) d.push("  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })");
    if (o.errores.includes('404')) d.push("  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })");

    // Parámetros del método
    const args = [];
    const llamada = [];
    for (const p of o.pathParams) {
      nestDec.add('Param'); nestDec.add('ParseIntPipe');
      const nombre = p.name === 'id' ? 'id' : p.name.replace(/_(\w)/g, (_, c) => c.toUpperCase());
      args.push(`@Param(${js(p.name)}, ParseIntPipe) ${nombre}: number`);
      llamada.push(nombre);
    }
    if (o.body) {
      nestDec.add('Body');
      const n = pascal(o.nombre) + 'Dto';
      entradas.add(n);
      args.push(`@Body() body: ${n}`);
      llamada.push('body');
    }
    if (o.queryParams.length) {
      nestDec.add('Query');
      const n = pascal(o.nombre) + 'Query';
      entradas.add(n);
      args.push(`@Query() query: ${n}`);
      llamada.push('query');
    }
    if (o.tipoContenido === 'application/pdf') {
      nestDec.add('StreamableFile');
    }
    const retTs = o.tipoContenido === 'application/pdf' ? 'StreamableFile' : tipoRespuestaTs(o.esquemaResp);
    metodosCtrl.push([
      ...d,
      `  ${o.nombre}(${args.join(', ')}): Promise<${retTs}> {`,
      `    return this.servicio.${o.nombre}(${llamada.join(', ')});`,
      '  }',
    ].join('\n'));

    const argsSrv = args.map((a) => a.replace(/@\w+\([^)]*\)\s*/, ''));
    metodosSrv.push([
      `  async ${o.nombre}(${argsSrv.map((a) => a.replace(/^(\w+):/, '_$1:')).join(', ')}): Promise<${retTs}> {`,
      `    throw new NotImplementedException(${js(o.nombre)});`,
      '  }',
    ].join('\n'));
  }

  const importsModelos = [...modelos].sort();
  const importsEntradas = [...entradas].sort();
  const ctrl = [
    '// Rutas de ' + tag + '. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.',
    `import { ${[...nestDec].filter((x) => x !== 'StreamableFile').sort().join(', ')}${nestDec.has('StreamableFile') ? ', StreamableFile' : ''} } from '@nestjs/common';`,
    `import { ${[...swaggerDec].sort().join(', ')} } from '@nestjs/swagger';`,
    "import { ErrorApi } from '@sahs/comun';",
    importsModelos.length ? `import { ${importsModelos.join(', ')} } from '../dto/modelos';` : null,
    importsEntradas.length ? `import { ${importsEntradas.join(', ')} } from '../dto/entradas';` : null,
    `import { ${Clase}Service } from './${slug}.service';`,
    '',
    `@ApiTags(${js(tag)})`,
    `@Controller(${js(svc.prefijo)})`,
    `export class ${Clase}Controller {`,
    `  constructor(private readonly servicio: ${Clase}Service) {}`,
    '',
    metodosCtrl.join('\n\n'),
    '}',
    '',
  ].filter((l) => l !== null).join('\n');

  const srv = [
    `import { Injectable, NotImplementedException${metodosSrv.some((m) => m.includes('StreamableFile')) ? ', StreamableFile' : ''} } from '@nestjs/common';`,
    importsModelos.length ? `import type { ${importsModelos.join(', ')} } from '../dto/modelos';` : null,
    importsEntradas.length ? `import type { ${importsEntradas.join(', ')} } from '../dto/entradas';` : null,
    '',
    '@Injectable()',
    `export class ${Clase}Service {`,
    metodosSrv.join('\n\n'),
    '}',
    '',
  ].filter((l) => l !== null).join('\n');

  escribir(`apps/${svc.app}/src/${slug}/${slug}.controller.ts`, ctrl);
  const rutaSrv = `apps/${svc.app}/src/${slug}/${slug}.service.ts`;
  if (FORZAR_SERVICES || !fs.existsSync(path.join(RAIZ, rutaSrv))) escribir(rutaSrv, srv);
  return { slug, Clase };
}

function generarSwagger(svc, spec) {
  const desc = spec.info.description
    .split('\n')
    .filter((l) => !/No hay backend/.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return [
    '// Datos del documento OpenAPI del servicio. Generado una vez por tools/generar_scaffold.mjs.',
    "import type { InfoSwagger } from '@sahs/comun';",
    '',
    'export const INFO_SWAGGER: InfoSwagger = {',
    `  titulo: ${js(spec.info.title)},`,
    `  descripcion: ${js(desc)},`,
    `  version: ${js(spec.info.version)},`,
    `  tags: ${js(spec.tags.filter((t) => t.name !== 'Health'))},`,
    `  dependencias: ${js(spec.info['x-dependencias'] || [])},`,
    '};',
    '',
  ].join('\n');
}


/* ---------- armazón de cada app (solo si no existe) ---------- */

const ENTIDADES_POR_APP = {
  usuario: 'ENTIDADES_USUARIO',
  pago: 'ENTIDADES_PAGO',
  horarios: 'ENTIDADES_HORARIOS',
  planificacion: 'ENTIDADES_PLANIFICACION',
  orientacion: 'ENTIDADES_ORIENTACION',
  'profesor-suplencias': 'ENTIDADES_PROFESOR_SUPLENCIAS',
};

function escribirSiFalta(rel, contenido) {
  if (!fs.existsSync(path.join(RAIZ, rel))) escribir(rel, contenido);
}

function generarArmazon(svc, spec) {
  const ent = ENTIDADES_POR_APP[svc.app];
  escribirSiFalta(`apps/${svc.app}/package.json`, JSON.stringify({
    name: `@sahs/${svc.app}`,
    version: '1.0.0',
    private: true,
    description: `Microservicio ${spec.info.title.replace(' Service', '')} de SAHS (NestJS)`,
    main: 'dist/main.js',
    scripts: {
      build: 'tsc -p tsconfig.json',
      start: 'node dist/main.js',
      dev: 'tsc -p tsconfig.json && node dist/main.js',
      test: 'jest --passWithNoTests',
    },
    dependencies: {
      '@nestjs/common': '^11.1.0',
      '@nestjs/core': '^11.1.0',
      '@nestjs/platform-express': '^11.1.0',
      '@nestjs/swagger': '^11.2.0',
      '@nestjs/typeorm': '^11.0.0',
      '@sahs/comun': '1.0.0',
      '@sahs/contratos': '1.0.0',
      '@sahs/entidades': '1.0.0',
      'better-sqlite3': '^11.10.0',
      'class-transformer': '^0.5.1',
      'class-validator': '^0.14.2',
      'reflect-metadata': '^0.2.2',
      rxjs: '^7.8.2',
      typeorm: '^0.3.27',
    },
  }, null, 2) + '\n');
  escribirSiFalta(`apps/${svc.app}/tsconfig.json`, JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { outDir: 'dist', rootDir: 'src', declaration: false },
    include: ['src'],
  }, null, 2) + '\n');
  escribirSiFalta(`apps/${svc.app}/src/app.module.ts`, [
    "import { Module } from '@nestjs/common';",
    "import { TypeOrmModule } from '@nestjs/typeorm';",
    "import { HealthController, opcionesBase } from '@sahs/comun';",
    `import { ${ent} } from '@sahs/entidades';`,
    "import { CONTROLLERS, SERVICES } from './rutas';",
    '',
    '@Module({',
    '  imports: [',
    `    TypeOrmModule.forRoot(opcionesBase(${ent})),`,
    `    TypeOrmModule.forFeature(${ent}),`,
    '  ],',
    '  controllers: [HealthController, ...CONTROLLERS],',
    '  providers: [...SERVICES],',
    '})',
    'export class AppModule {}',
    '',
  ].join('\n'));
  escribirSiFalta(`apps/${svc.app}/src/main.ts`, [
    "import 'reflect-metadata';",
    "import { arrancarServicio } from '@sahs/comun';",
    "import { AppModule } from './app.module';",
    "import { INFO_SWAGGER } from './swagger';",
    '',
    `arrancarServicio(${js(svc.prefijo)}, AppModule, INFO_SWAGGER);`,
    '',
  ].join('\n'));
}

function main() {
  if (!process.argv.includes('--forzar') && fs.existsSync(path.join(RAIZ, 'apps/usuario/src/rutas.ts'))) {
    console.error('El scaffolding ya se generó y el código se edita a mano: correrlo de nuevo pisaría los cambios.');
    console.error('Si de verdad hace falta (por ejemplo, en una copia limpia), usar --forzar.');
    process.exit(1);
  }
  const todos = SERVICIOS.map((svc) => ({ svc, spec: JSON.parse(fs.readFileSync(path.join(RAIZ, 'specs', svc.spec + '.json'), 'utf8')) }));
  generarContratos(todos);
  for (const { svc, spec } of todos) {
    const ops = operaciones(spec);
    escribir(`apps/${svc.app}/src/dto/modelos.ts`, generarModelos(svc, spec));
    escribir(`apps/${svc.app}/src/dto/entradas.ts`, generarEntradas(svc, ops));
    escribir(`apps/${svc.app}/src/swagger.ts`, generarSwagger(svc, spec));
    generarArmazon(svc, spec);
    const tags = [...new Set(ops.map((o) => o.tag))];
    const modulos = tags.map((t) => generarControllerYService(svc, spec, t, ops.filter((o) => o.tag === t)));
    escribir(`apps/${svc.app}/src/rutas.ts`, [
      '// Controllers y services del servicio, uno por tag del swagger.',
      ...modulos.map((m) => `import { ${m.Clase}Controller } from './${m.slug}/${m.slug}.controller';\nimport { ${m.Clase}Service } from './${m.slug}/${m.slug}.service';`),
      '',
      `export const CONTROLLERS = [${modulos.map((m) => m.Clase + 'Controller').join(', ')}];`,
      `export const SERVICES = [${modulos.map((m) => m.Clase + 'Service').join(', ')}];`,
      '',
    ].join('\n'));
    console.log(`${svc.app}: ${ops.length} operaciones en ${tags.length} controllers`);
  }
}

main();
