/*
 * Pruebas e2e de los 6 microservicios: levanta los servicios reales sobre una base
 * SQLite temporal con los seeds y recorre los escenarios de
 * openspec/changes/monorepo-sahs/specs/microservicios-nest.
 *
 * Uso:  npm run build && npm test
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SERVICIOS = {
  usuario: 9281,
  pago: 9282,
  horarios: 9283,
  planificacion: 9284,
  orientacion: 9285,
  profesor_suplencias: 9286,
};
const APP = { profesor_suplencias: 'profesor-suplencias' };
const procesos = [];
let tmp;

const url = (svc, ruta) => `http://localhost:${SERVICIOS[svc]}/${svc}/${ruta}`;
async function api(metodo, svc, ruta, body) {
  const r = await fetch(url(svc, ruta), {
    method: metodo,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await r.text();
  let datos = texto;
  try {
    datos = texto ? JSON.parse(texto) : undefined;
  } catch {
    /* PDF u otro contenido */
  }
  return { status: r.status, datos, tipo: r.headers.get('content-type') };
}
const get = (svc, ruta) => api('GET', svc, ruta);

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sahs-e2e-'));
  const db = path.join(tmp, 'sahs.sqlite');
  execFileSync('node', [path.join(RAIZ, 'apps/db/dist/db-init.js')], { env: { ...process.env, DB_PATH: db }, stdio: 'ignore' });
  const urls = Object.fromEntries(Object.entries(SERVICIOS).map(([s, p]) => ['URL_' + s.toUpperCase(), `http://localhost:${p}`]));
  for (const [svc, puerto] of Object.entries(SERVICIOS)) {
    const p = spawn('node', [path.join(RAIZ, `apps/${APP[svc] ?? svc}/dist/main.js`)], {
      env: { ...process.env, ...urls, DB_PATH: db, PORT: String(puerto) },
      stdio: 'ignore',
    });
    procesos.push(p);
  }
  for (const puerto of Object.values(SERVICIOS)) {
    const fin = Date.now() + 20000;
    for (;;) {
      try {
        if ((await fetch(`http://localhost:${puerto}/actuator/health`)).ok) break;
      } catch {
        /* todavía no */
      }
      if (Date.now() > fin) throw new Error(`No arrancó el servicio del puerto ${puerto}`);
      await new Promise((r) => setTimeout(r, 200));
    }
  }
});

after(() => {
  for (const p of procesos) p.kill();
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

describe('convenciones', () => {
  test('health check', async () => {
    const r = await fetch(`http://localhost:${SERVICIOS.pago}/actuator/health`);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { status: 'UP' });
  });

  test('swagger publicado con x-dependencias', async () => {
    const d = await (await fetch(`http://localhost:${SERVICIOS.pago}/docs-json`)).json();
    assert.ok(d.openapi.startsWith('3'));
    assert.ok(d.paths['/pago/crear_pago']);
    assert.ok(d.info['x-dependencias'].some((x) => x.servicio === 'profesor_suplencias' && x.endpoint === 'get_profesor'));
  });

  test('body inválido → 400 VALIDACION', async () => {
    const r = await api('POST', 'usuario', 'crear_usuario', { nombre_user: 'x' });
    assert.equal(r.status, 400);
    assert.equal(r.datos.codigo, 'VALIDACION');
    assert.match(r.datos.mensaje, /email es obligatorio/);
  });

  test('inexistente → 404 NO_ENCONTRADO', async () => {
    const r = await get('usuario', 'get_usuario/9999');
    assert.equal(r.status, 404);
    assert.equal(r.datos.codigo, 'NO_ENCONTRADO');
  });

  test('la contraseña nunca aparece en las respuestas', async () => {
    const r = await get('usuario', 'get_usuarios');
    assert.ok(r.datos.length >= 10);
    assert.ok(r.datos.every((u) => !('contrasenia' in u)));
  });
});

describe('Usuario', () => {
  test('login por nombre de usuario, sin distinguir mayúsculas', async () => {
    const r = await api('POST', 'usuario', 'login', { email: 'JRamirez', contrasenia: 'sahs2026' });
    assert.equal(r.status, 200);
    assert.equal(r.datos.usuario.nombre_user, 'jramirez');
    assert.equal(r.datos.usuario.rol.nombre_rol, 'Profesor');
    assert.ok(r.datos.token);
  });

  test('contraseña incorrecta → 400', async () => {
    const r = await api('POST', 'usuario', 'login', { email: 'jramirez', contrasenia: 'otra' });
    assert.equal(r.status, 400);
    assert.equal(r.datos.mensaje, 'Usuario o contraseña incorrectos');
  });

  test('crear, leer y eliminar', async () => {
    const c = await api('POST', 'usuario', 'crear_usuario', { nombre_user: 'prueba', email: 'prueba@donbosco.edu.ar', contrasenia: 'secreta1', id_rol: 2 });
    assert.equal(c.status, 201);
    const g = await get('usuario', `get_usuario/${c.datos.id_usuario}`);
    assert.equal(g.datos.email, 'prueba@donbosco.edu.ar');
    assert.equal((await api('DELETE', 'usuario', `eliminar_usuario/${c.datos.id_usuario}`)).status, 204);
    assert.equal((await get('usuario', `get_usuario/${c.datos.id_usuario}`)).status, 404);
  });

  test('privilegios del rol y quitar/asignar', async () => {
    const antes = (await get('usuario', 'get_rol_privilegios/2')).datos.map((p) => p.id_privilegio);
    assert.deepEqual(antes, [12, 13, 14]);
    assert.equal((await api('DELETE', 'usuario', 'quitar_privilegio/2/14')).status, 200);
    assert.deepEqual((await get('usuario', 'get_rol_privilegios/2')).datos.map((p) => p.id_privilegio), [12, 13]);
    assert.equal((await api('POST', 'usuario', 'asignar_privilegio/2', { id_privilegio: 14 })).status, 200);
  });
});

describe('Horarios', () => {
  test('crear y leer un turno', async () => {
    const c = await api('POST', 'horarios', 'crear_turno', { nombre: 'Vespertino', cantidad_franjas_total: 10 });
    assert.equal(c.status, 201);
    const g = await get('horarios', `get_turno/${c.datos.id_turno}`);
    assert.equal(g.status, 200);
    assert.equal(g.datos.nombre, 'Vespertino');
  });

  test('los recreos son franjas', async () => {
    const t = (await get('horarios', 'get_turnos')).datos.find((x) => x.nombre === 'Mañana');
    assert.ok(t.franjas_horarias.some((f) => f.es_recreo));
  });
});

describe('Planificación', () => {
  test('filtros combinados en get_clases', async () => {
    const props = (await get('planificacion', 'get_propuestas')).datos;
    const vigente = props.find((p) => p.codigo === 'PLAN-2026-01');
    const r = await get('planificacion', `get_clases?id_profesor=1&id_propuesta=${vigente.id_propuesta}`);
    assert.equal(r.status, 200);
    assert.ok(r.datos.length > 0);
    assert.ok(r.datos.every((c) => c.ids_profesores.includes(1) && vigente.ids_clases.includes(c.id_clase)));
  });

  test('get_clase anida materia, franjas y profesores de otros servicios', async () => {
    const r = await get('planificacion', 'get_clase/1');
    assert.equal(r.status, 200);
    assert.ok(r.datos.materia.nombre_materia);
    assert.ok(r.datos.franjas_horarias[0].nombre_dia_lectivo);
    assert.ok(r.datos.profesores[0].apellido);
  });

  test('transición inválida de la propuesta → 409', async () => {
    const borr = (await get('planificacion', 'get_propuestas')).datos.find((p) => p.estado.codigo === 'BOR');
    const val = (await get('planificacion', 'get_posibles_estados_de_propuestas')).datos.find((e) => e.codigo === 'VAL');
    const r = await api('PUT', 'planificacion', `asignar_estado_a_propuesta/${borr.id_propuesta}`, { id_estado: val.id_estado });
    assert.equal(r.status, 409);
    assert.equal((await get('planificacion', `get_propuesta/${borr.id_propuesta}`)).datos.estado.codigo, 'BOR');
  });

  test('profesor no disponible → 409 con el profesor y la franja', async () => {
    const curso = (await get('planificacion', 'get_cursos')).datos.find((c) => c.turno?.nombre === 'Mañana');
    const mat = curso.materias[0];
    const profes = (await get('orientacion', `get_profesores_materia/${mat.id_materia}`)).datos;
    const prof = (await get('profesor_suplencias', `get_profesor/${profes[0].id_profesor}`)).datos;
    const libres = new Set(prof.disponibilidad.map((f) => f.id_franja_horaria));
    const ocupada = curso.franjas_horarias.find((f) => !f.es_recreo && !libres.has(f.id_franja_horaria));
    const r = await api('POST', 'planificacion', 'crear_clase', {
      codigo: 'T-1', id_curso: curso.id_curso, id_materia: mat.id_materia,
      ids_franjas_horarias: [ocupada.id_franja_horaria], ids_profesores: [prof.id_profesor],
    });
    assert.equal(r.status, 409);
    assert.match(r.datos.mensaje, new RegExp(prof.apellido));
    assert.match(r.datos.mensaje, new RegExp(ocupada.hora_inicio));
  });

  test('crear curso registra la orientación en Orientación', async () => {
    const ciclo = (await get('planificacion', 'get_ciclos_lectivos')).datos[0];
    const turno = (await get('horarios', 'get_turnos')).datos[0];
    const orient = (await get('orientacion', 'get_orientaciones')).datos[0];
    const c = await api('POST', 'planificacion', 'crear_curso', {
      division: 'Z', id_ciclo_lectivo: ciclo.id_ciclo_lectivo, id_turno: turno.id_turno, id_orientacion: orient.id_orientacion,
    });
    assert.equal(c.status, 201);
    assert.equal(c.datos.id_orientacion, orient.id_orientacion);
    assert.ok((await get('orientacion', `get_orientacion/${orient.id_orientacion}`)).datos.ids_cursos.includes(c.datos.id_curso));
  });
});

describe('Profesor y Suplencias', () => {
  test('superposición de períodos', async () => {
    const r = await get('profesor_suplencias', 'get_suplencias?fecha_desde=2026-05-14&fecha_hasta=2026-05-31');
    assert.equal(r.status, 200);
    assert.ok(r.datos.some((s) => s.fecha_inicio === '2026-05-11' && s.fecha_fin === '2026-05-15'));
    assert.equal((await get('profesor_suplencias', 'get_suplencias?fecha_desde=2026-07-01&fecha_hasta=2026-07-31')).datos.length, 0);
  });

  test('un recreo no se puede declarar como disponible', async () => {
    const recreo = (await get('horarios', 'get_franjas_horarias')).datos.find((f) => f.es_recreo);
    const r = await api('PUT', 'profesor_suplencias', 'asignar_disponibilidad/1', { ids_franjas_horarias: [recreo.id_franja_horaria] });
    assert.equal(r.status, 400);
  });
});

describe('Pago', () => {
  test('referencia inexistente en otro servicio → 400 y no crea el pago', async () => {
    const r = await api('POST', 'pago', 'crear_pago', { id_profesor: 9999, periodo: '2026-09' });
    assert.equal(r.status, 400);
    assert.equal((await get('pago', 'get_pagos?id_profesor=9999')).datos.length, 0);
  });

  test('calcular_monto_a_liquidar coincide con el recibo del período', async () => {
    const r = await get('pago', 'calcular_monto_a_liquidar/1?periodo=2026-08');
    const rec = (await get('pago', 'get_recibos_de_sueldo?id_profesor=1&periodo=2026-08')).datos[0];
    assert.equal(r.datos.monto, rec.neto);
    assert.equal(rec.neto, 116424);
  });

  test('firma definitiva', async () => {
    const firmado = (await get('pago', 'get_recibos_de_sueldo?id_profesor=1')).datos.find((x) => x.firma_receptor);
    const r = await api('POST', 'pago', `firmar_recibo_de_sueldo/${firmado.id_recibo_sueldo}`, { id_usuario: 10 });
    assert.equal(r.status, 409);
    const otra = (await get('pago', `get_recibos_de_sueldo?id_profesor=1&periodo=${firmado.periodo}`)).datos[0];
    assert.equal(otra.firma_receptor.fecha, firmado.firma_receptor.fecha);
  });

  test('descargar recibo en PDF', async () => {
    const r = await get('pago', 'bajar_recibo_sueldo/1');
    assert.equal(r.status, 200);
    assert.match(r.tipo, /application\/pdf/);
  });
});

describe('dependencias caídas', () => {
  test('si Orientación no responde, get_clase responde 503 en menos de 6 s', async () => {
    const i = Object.keys(SERVICIOS).indexOf('orientacion');
    procesos[i].kill();
    await new Promise((r) => setTimeout(r, 300));
    const t0 = Date.now();
    const r = await get('planificacion', 'get_clase/1');
    assert.equal(r.status, 503);
    assert.equal(r.datos.codigo, 'SERVICIO_NO_DISPONIBLE');
    assert.ok(Date.now() - t0 < 6000);
  });
});
