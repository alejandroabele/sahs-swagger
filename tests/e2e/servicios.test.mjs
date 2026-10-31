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

const url = (svc, ruta) => `http://localhost:${SERVICIOS[svc]}/${svc.replace(/_/g, '-')}/${ruta}`;
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
    assert.ok(d.paths['/pago/pagos']?.post?.operationId === 'crear_pago');
    assert.ok(d.info['x-dependencias'].some((x) => x.servicio === 'profesor_suplencias' && x.endpoint === 'get_profesor'));
  });

  test('body inválido → 400 VALIDACION', async () => {
    const r = await api('POST', 'usuario', 'usuarios', { nombre_user: 'x' });
    assert.equal(r.status, 400);
    assert.equal(r.datos.codigo, 'VALIDACION');
    assert.match(r.datos.mensaje, /email es obligatorio/);
  });

  test('inexistente → 404 NO_ENCONTRADO', async () => {
    const r = await get('usuario', 'usuarios/9999');
    assert.equal(r.status, 404);
    assert.equal(r.datos.codigo, 'NO_ENCONTRADO');
  });

  test('la contraseña nunca aparece en las respuestas', async () => {
    const r = await get('usuario', 'usuarios');
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
    const c = await api('POST', 'usuario', 'usuarios', { nombre_user: 'prueba', email: 'prueba@donbosco.edu.ar', contrasenia: 'secreta1', id_rol: 2 });
    assert.equal(c.status, 201);
    const g = await get('usuario', `usuarios/${c.datos.id_usuario}`);
    assert.equal(g.datos.email, 'prueba@donbosco.edu.ar');
    assert.equal((await api('DELETE', 'usuario', `usuarios/${c.datos.id_usuario}`)).status, 204);
    assert.equal((await get('usuario', `usuarios/${c.datos.id_usuario}`)).status, 404);
  });

  test('privilegios del rol y quitar/asignar', async () => {
    const antes = (await get('usuario', 'roles/2/privilegios')).datos.map((p) => p.id_privilegio);
    assert.deepEqual(antes, [12, 13, 14]);
    assert.equal((await api('DELETE', 'usuario', 'roles/2/privilegios/14')).status, 200);
    assert.deepEqual((await get('usuario', 'roles/2/privilegios')).datos.map((p) => p.id_privilegio), [12, 13]);
    assert.equal((await api('POST', 'usuario', 'roles/2/privilegios', { id_privilegio: 14 })).status, 200);
  });
});

describe('Horarios', () => {
  test('crear y leer un turno', async () => {
    const c = await api('POST', 'horarios', 'turnos', { nombre: 'Vespertino', cantidad_franjas_total: 10 });
    assert.equal(c.status, 201);
    const g = await get('horarios', `turnos/${c.datos.id_turno}`);
    assert.equal(g.status, 200);
    assert.equal(g.datos.nombre, 'Vespertino');
  });

  test('los recreos son franjas', async () => {
    const t = (await get('horarios', 'turnos')).datos.find((x) => x.nombre === 'Mañana');
    assert.ok(t.franjas_horarias.some((f) => f.es_recreo));
  });
});

describe('Planificación', () => {
  test('filtros combinados en get_clases', async () => {
    const props = (await get('planificacion', 'propuestas')).datos;
    const vigente = props.find((p) => p.codigo === 'PLAN-2026-01');
    const r = await get('planificacion', `clases?id_profesor=1&id_propuesta=${vigente.id_propuesta}`);
    assert.equal(r.status, 200);
    assert.ok(r.datos.length > 0);
    assert.ok(r.datos.every((c) => c.ids_profesores.includes(1) && vigente.ids_clases.includes(c.id_clase)));
  });

  test('get_clase anida materia, franjas y profesores de otros servicios', async () => {
    const r = await get('planificacion', 'clases/1');
    assert.equal(r.status, 200);
    assert.ok(r.datos.materia.nombre_materia);
    assert.ok(r.datos.franjas_horarias[0].nombre_dia_lectivo);
    assert.ok(r.datos.profesores[0].apellido);
  });

  test('fachada get_armado_propuesta: propuesta, estados y cursos del ciclo con su año, sin clases', async () => {
    const prop = (await get('planificacion', 'propuestas')).datos.find((p) => p.codigo === 'PLAN-2026-01');
    const r = await get('planificacion', `propuestas/${prop.id_propuesta}/armado`);
    assert.equal(r.status, 200);
    assert.equal(r.datos.propuesta.id_propuesta, prop.id_propuesta);
    assert.ok(r.datos.propuesta.estado.codigo);
    assert.deepEqual(r.datos.estados, (await get('planificacion', 'estados-propuesta')).datos);
    const cursos = (await get('planificacion', `cursos?id_ciclo_lectivo=${prop.id_ciclo_lectivo}`)).datos;
    assert.deepEqual(r.datos.cursos.map((c) => c.id_curso).sort(), cursos.map((c) => c.id_curso).sort());
    const c = r.datos.cursos[0];
    assert.equal(c.anio_academico.id_anio_academico, c.id_anio_academico);
    assert.ok(c.turno.nombre && c.orientacion.nombre_orientacion && c.materias.length && c.franjas_horarias.length);
    assert.equal(c.clases, undefined);
    assert.equal((await get('planificacion', 'propuestas/99999/armado')).status, 404);
  });

  test('transición inválida de la propuesta → 409', async () => {
    const borr = (await get('planificacion', 'propuestas')).datos.find((p) => p.estado.codigo === 'BOR');
    const vig = (await get('planificacion', 'estados-propuesta')).datos.find((e) => e.codigo === 'VIG');
    const r = await api('PUT', 'planificacion', `propuestas/${borr.id_propuesta}/estado`, { id_estado: vig.id_estado });
    assert.equal(r.status, 409);
    assert.equal((await get('planificacion', `propuestas/${borr.id_propuesta}`)).datos.estado.codigo, 'BOR');
  });

  test('plan de estudios en tres niveles: año → orientación → materias', async () => {
    const r = await get('orientacion', 'plan-de-estudios');
    assert.equal(r.status, 200);
    const primero = r.datos[0];
    assert.ok(primero.anio_curricular);
    assert.ok(primero.orientaciones[0].nombre_orientacion);
    assert.ok(primero.orientaciones[0].materias[0].nombre_materia);
    const total = r.datos.flatMap((a) => a.orientaciones.flatMap((o) => o.materias)).length;
    assert.equal(total, (await get('orientacion', 'materias')).datos.length);
    const idOr = primero.orientaciones[0].id_orientacion;
    const filtrado = (await get('orientacion', `plan-de-estudios?id_orientacion=${idOr}`)).datos;
    assert.ok(filtrado.every((a) => a.orientaciones.length === 1 && a.orientaciones[0].id_orientacion === idOr));
  });

  test('crear_suplencia cuelga del profesor que la cubre: profesor inexistente → 404', async () => {
    const r = await api('POST', 'profesor_suplencias', 'profesores/99999/suplencias', {
      fecha_inicio: '2026-05-04', fecha_fin: '2026-05-08', motivo: 'Licencia médica', ids_clases: [1],
    });
    assert.equal(r.status, 404);
  });

  test('propuesta incompleta no pasa a revisión → 409 con curso, materia y horas', async () => {
    const borr = (await get('planificacion', 'propuestas')).datos.find((p) => p.estado.codigo === 'BOR');
    const rev = (await get('planificacion', 'estados-propuesta')).datos.find((e) => e.codigo === 'REV');
    const r = await api('PUT', 'planificacion', `propuestas/${borr.id_propuesta}/estado`, { id_estado: rev.id_estado });
    assert.equal(r.status, 409);
    assert.match(r.datos.mensaje, /no está completa: [^:]+: .+ \d+ de \d+ h/);
    assert.equal((await get('planificacion', `propuestas/${borr.id_propuesta}`)).datos.estado.codigo, 'BOR');
  });

  test('profesor no disponible → 409 con el profesor y la franja', async () => {
    const curso = (await get('planificacion', 'cursos')).datos.find((c) => c.turno?.nombre === 'Mañana');
    const mat = curso.materias[0];
    const profes = (await get('orientacion', `materias/${mat.id_materia}/profesores`)).datos;
    const prof = (await get('profesor_suplencias', `profesores/${profes[0].id_profesor}`)).datos;
    const libres = new Set(prof.disponibilidad.map((f) => f.id_franja_horaria));
    const ocupada = curso.franjas_horarias.find((f) => !f.es_recreo && !libres.has(f.id_franja_horaria));
    const r = await api('POST', 'planificacion', 'clases', {
      codigo: 'T-1', id_curso: curso.id_curso, id_materia: mat.id_materia,
      ids_franjas_horarias: [ocupada.id_franja_horaria], ids_profesores: [prof.id_profesor],
    });
    assert.equal(r.status, 409);
    assert.match(r.datos.mensaje, new RegExp(prof.apellido));
    assert.match(r.datos.mensaje, new RegExp(ocupada.hora_inicio));
  });

  test('crear curso registra la orientación en Orientación', async () => {
    const ciclo = (await get('planificacion', 'ciclos-lectivos')).datos[0];
    const turno = (await get('horarios', 'turnos')).datos[0];
    const orient = (await get('orientacion', 'orientaciones')).datos[0];
    const c = await api('POST', 'planificacion', 'cursos', {
      division: 'Z', id_ciclo_lectivo: ciclo.id_ciclo_lectivo, id_turno: turno.id_turno, id_orientacion: orient.id_orientacion,
    });
    assert.equal(c.status, 201);
    assert.equal(c.datos.id_orientacion, orient.id_orientacion);
    assert.ok((await get('orientacion', `orientaciones/${orient.id_orientacion}`)).datos.ids_cursos.includes(c.datos.id_curso));
  });

  test('cambiar las horas de una materia del curso, con la materia en la ruta', async () => {
    const curso = (await get('planificacion', 'cursos')).datos.find((c) => c.materias.length);
    const mat = curso.materias[0];
    const nuevas = mat.horas_semanales === 5 ? 6 : 5;
    const r = await api('PATCH', 'planificacion', `cursos/${curso.id_curso}/materias/${mat.id_materia}`, { horas_semanales: nuevas });
    assert.equal(r.status, 200);
    assert.equal(r.datos.materias.find((m) => m.id_materia === mat.id_materia).horas_semanales, nuevas);
    assert.equal((await api('PATCH', 'planificacion', `cursos/${curso.id_curso}/materias/99999`, { horas_semanales: 4 })).status, 404);
    await api('PATCH', 'planificacion', `cursos/${curso.id_curso}/materias/${mat.id_materia}`, { horas_semanales: mat.horas_semanales });
  });
});

describe('Profesor y Suplencias', () => {
  test('superposición de períodos', async () => {
    const r = await get('profesor_suplencias', 'suplencias?fecha_desde=2026-05-14&fecha_hasta=2026-05-31');
    assert.equal(r.status, 200);
    assert.ok(r.datos.some((s) => s.fecha_inicio === '2026-05-11' && s.fecha_fin === '2026-05-15'));
    assert.equal((await get('profesor_suplencias', 'suplencias?fecha_desde=2026-07-01&fecha_hasta=2026-07-31')).datos.length, 0);
  });

  test('un recreo no se puede declarar como disponible', async () => {
    const recreo = (await get('horarios', 'franjas-horarias')).datos.find((f) => f.es_recreo);
    const r = await api('PUT', 'profesor_suplencias', 'profesores/1/disponibilidad', { ids_franjas_horarias: [recreo.id_franja_horaria] });
    assert.equal(r.status, 400);
  });
});

describe('Reglas de negocio', () => {
  const estado = async (codigo) => (await get('planificacion', 'estados-propuesta')).datos.find((e) => e.codigo === codigo);
  const pasar = async (id, codigo) => api('PUT', 'planificacion', `propuestas/${id}/estado`, { id_estado: (await estado(codigo)).id_estado });
  const propuesta = async (codigo) => (await get('planificacion', 'propuestas')).datos.find((p) => p.codigo === codigo);
  const nuevoProfesor = async (documento) =>
    (await api('POST', 'profesor_suplencias', 'profesores', { nombre: 'Prueba', apellido: 'Reglas' + documento, documento, correo_electronico: `p${documento}@x.com` })).datos;

  test('catálogo de estados: Borrador, En revisión, Vigente y Fue vigente', async () => {
    const codigos = (await get('planificacion', 'estados-propuesta')).datos.map((e) => e.codigo).sort();
    assert.deepEqual(codigos, ['BOR', 'FVG', 'REV', 'VIG']);
  });

  test('una propuesta Vigente no cambia de estado a mano → 409', async () => {
    const vig = (await get('planificacion', 'propuestas')).datos.find((p) => p.estado.codigo === 'VIG');
    for (const codigo of ['FVG', 'BOR']) {
      const r = await pasar(vig.id_propuesta, codigo);
      assert.equal(r.status, 409);
      assert.match(r.datos.mensaje, /Vigente/);
    }
    assert.equal((await get('planificacion', `propuestas/${vig.id_propuesta}`)).datos.estado.codigo, 'VIG');
  });

  test('horas de más: la clase no puede pasar las horas semanales y la propuesta no pasa a revisión', async () => {
    const borr = (await get('planificacion', 'propuestas')).datos.find((p) => p.estado.codigo === 'BOR');
    const clase = (await get('planificacion', `clases?id_propuesta=${borr.id_propuesta}`)).datos.find((c) => c.ids_franjas_horarias.length >= 2);
    const n = clase.ids_franjas_horarias.length;
    const curso = (await get('planificacion', `cursos/${clase.id_curso}`)).datos;
    const horas = curso.materias.find((m) => m.id_materia === clase.id_materia).horas_semanales;
    const rutaHoras = `cursos/${clase.id_curso}/materias/${clase.id_materia}`;
    await api('PATCH', 'planificacion', rutaHoras, { horas_semanales: n - 1 });
    try {
      const e = await api('PUT', 'planificacion', `clases/${clase.id_clase}`, { ids_franjas_horarias: clase.ids_franjas_horarias, ids_profesores: clase.ids_profesores });
      assert.equal(e.status, 409);
      assert.match(e.datos.mensaje, new RegExp(`${clase.materia.nombre_materia} en .+ de ${n - 1} h: la clase suma ${n} más`));
      const r = await pasar(borr.id_propuesta, 'REV');
      assert.equal(r.status, 409);
      assert.match(r.datos.mensaje, new RegExp(`${clase.materia.nombre_materia} ${n} de ${n - 1} h`));
    } finally {
      await api('PATCH', 'planificacion', rutaHoras, { horas_semanales: horas });
    }
  });

  test('una sola Vigente por ciclo: la anterior pasa sola a Fue vigente', async () => {
    const vigente2026 = (await get('planificacion', 'propuestas')).datos.find((p) => p.estado.codigo === 'VIG' && p.codigo === 'PLAN-2026-01');
    const ciclo = (await api('POST', 'planificacion', 'ciclos-lectivos', { anio_calendario: 2099 })).datos;
    const turno = (await get('horarios', 'turnos')).datos.find((t) => t.nombre === 'Mañana');
    const orient = (await get('orientacion', 'orientaciones')).datos[0];
    const curso = (await api('POST', 'planificacion', 'cursos', {
      division: 'R', id_ciclo_lectivo: ciclo.id_ciclo_lectivo, id_turno: turno.id_turno, id_orientacion: orient.id_orientacion,
    })).datos;
    // Una materia de 1 hora, con un docente habilitado y disponible en una hora del turno.
    const profes = (await get('profesor_suplencias', 'profesores?activo=true')).datos;
    let materia, prof, franja;
    for (const p of profes) {
      const libre = turno.franjas_horarias.find((f) => !f.es_recreo && p.disponibilidad.some((d) => d.id_franja_horaria === f.id_franja_horaria));
      if (libre && p.lista_materias_habilitadas.length) {
        [materia, prof, franja] = [p.lista_materias_habilitadas[0], p, libre];
        break;
      }
    }
    await api('POST', 'planificacion', `cursos/${curso.id_curso}/materias`, { id_materia: materia.id_materia, horas_semanales: 1 });
    const clase = (await api('POST', 'planificacion', 'clases', {
      codigo: '2099-R', id_curso: curso.id_curso, id_materia: materia.id_materia,
      ids_franjas_horarias: [franja.id_franja_horaria], ids_profesores: [prof.id_profesor],
    })).datos;
    const ids = [];
    for (const codigo of ['PLAN-2099-01', 'PLAN-2099-02']) {
      const p = (await api('POST', 'planificacion', 'propuestas', { nombre: codigo, codigo, id_ciclo_lectivo: ciclo.id_ciclo_lectivo })).datos;
      assert.equal(p.estado.codigo, 'BOR');
      assert.equal((await api('POST', 'planificacion', `propuestas/${p.id_propuesta}/clases`, { id_clase: clase.id_clase })).status, 200);
      assert.equal((await pasar(p.id_propuesta, 'REV')).status, 200);
      const r = await pasar(p.id_propuesta, 'VIG');
      assert.equal(r.status, 200, r.datos?.mensaje);
      ids.push(p.id_propuesta);
    }
    assert.equal((await get('planificacion', `propuestas/${ids[0]}`)).datos.estado.codigo, 'FVG');
    assert.equal((await get('planificacion', `propuestas/${ids[1]}`)).datos.estado.codigo, 'VIG');
    const fvg = await estado('FVG');
    const historial = (await get('planificacion', `propuestas?id_ciclo_lectivo=${ciclo.id_ciclo_lectivo}&id_estado=${fvg.id_estado}`)).datos;
    assert.deepEqual(historial.map((p) => p.id_propuesta), [ids[0]]);
    // Fue vigente no tiene salida, y el otro ciclo no se tocó.
    assert.equal((await pasar(ids[0], 'BOR')).status, 409);
    assert.equal((await propuesta(vigente2026.codigo)).estado.codigo, 'VIG');
  });

  test('baja lógica: no si está en la Vigente; inactivo fuera de habilitados, clases y suplencias; reactivar', async () => {
    // Un docente de la propuesta Vigente de los seeds no se puede dar de baja.
    const vig = await propuesta('PLAN-2026-01');
    const claseVig = (await get('planificacion', `clases?id_propuesta=${vig.id_propuesta}`)).datos[0];
    const titular = claseVig.ids_profesores[0];
    const r = await api('PUT', 'profesor_suplencias', `profesores/${titular}/activo`, { activo: false });
    assert.equal(r.status, 409);
    assert.match(r.datos.mensaje, /Vigente/);
    assert.equal((await get('profesor_suplencias', `profesores/${titular}`)).datos.activo, true);

    // Uno nuevo, habilitado en la materia de la clase y disponible en sus franjas.
    const p = await nuevoProfesor('90000001');
    assert.equal(p.activo, true);
    await api('PUT', 'profesor_suplencias', `profesores/${p.id_profesor}/materias-habilitadas`, { ids_materias: [claseVig.id_materia] });
    await api('PUT', 'profesor_suplencias', `profesores/${p.id_profesor}/disponibilidad`, { ids_franjas_horarias: claseVig.ids_franjas_horarias });
    const habilitados = async () => (await get('orientacion', `materias/${claseVig.id_materia}/profesores`)).datos.map((x) => x.id_profesor);
    assert.ok((await habilitados()).includes(p.id_profesor));

    const baja = await api('PUT', 'profesor_suplencias', `profesores/${p.id_profesor}/activo`, { activo: false });
    assert.equal(baja.status, 200);
    assert.equal(baja.datos.activo, false);
    assert.ok(!(await habilitados()).includes(p.id_profesor));
    assert.ok((await get('profesor_suplencias', 'profesores?activo=false')).datos.some((x) => x.id_profesor === p.id_profesor));
    assert.ok(!(await get('profesor_suplencias', 'profesores?activo=true')).datos.some((x) => x.id_profesor === p.id_profesor));
    assert.ok((await get('profesor_suplencias', 'profesores')).datos.some((x) => x.id_profesor === p.id_profesor));

    const clase = await api('POST', 'planificacion', 'clases', {
      codigo: 'BAJA-1', id_curso: claseVig.id_curso, id_materia: claseVig.id_materia,
      ids_franjas_horarias: claseVig.ids_franjas_horarias, ids_profesores: [p.id_profesor],
    });
    assert.equal(clase.status, 409);
    assert.match(clase.datos.mensaje, /dado de baja/);
    const sup = await api('POST', 'profesor_suplencias', `profesores/${p.id_profesor}/suplencias`, {
      fecha_inicio: '2027-03-01', fecha_fin: '2027-03-05', motivo: 'Prueba', ids_clases: [claseVig.id_clase],
    });
    assert.equal(sup.status, 409);
    assert.match(sup.datos.mensaje, /dado de baja/);

    const alta = await api('PUT', 'profesor_suplencias', `profesores/${p.id_profesor}/activo`, { activo: true });
    assert.equal(alta.datos.activo, true);
    assert.ok((await habilitados()).includes(p.id_profesor));
  });

  test('el suplente tiene que estar habilitado en la materia y disponible en las franjas', async () => {
    const vig = await propuesta('PLAN-2026-01');
    const clase = (await get('planificacion', `clases?id_propuesta=${vig.id_propuesta}`)).datos[0];
    const p = await nuevoProfesor('90000002');
    const body = { fecha_inicio: '2027-04-05', fecha_fin: '2027-04-09', motivo: 'Prueba', ids_clases: [clase.id_clase] };
    const ruta = `profesores/${p.id_profesor}/suplencias`;

    let r = await api('POST', 'profesor_suplencias', ruta, body);
    assert.equal(r.status, 409);
    assert.match(r.datos.mensaje, /no tiene habilitada la materia/);

    await api('PUT', 'profesor_suplencias', `profesores/${p.id_profesor}/materias-habilitadas`, { ids_materias: [clase.id_materia] });
    r = await api('POST', 'profesor_suplencias', ruta, body);
    assert.equal(r.status, 409);
    assert.match(r.datos.mensaje, /no está disponible/);

    await api('PUT', 'profesor_suplencias', `profesores/${p.id_profesor}/disponibilidad`, { ids_franjas_horarias: clase.ids_franjas_horarias });
    r = await api('POST', 'profesor_suplencias', ruta, body);
    assert.equal(r.status, 201, r.datos?.mensaje);
  });

  test('el generador no tiene tope de horas diarias por materia', async () => {
    const { generar } = await import(path.join(RAIZ, 'apps/planificacion/dist/propuesta/generacion.js'));
    // Un curso con 4 horas, todas el lunes, y una materia de 4 horas.
    const horas = [0, 1, 2, 3].map((i) => ({ id: i + 1, d: 0, ini: 480 + 40 * i, fn: 520 + 40 * i }));
    const disponibilidad = horas.map((b) => ({ id_franja_horaria: b.id }));
    const r = generar({
      cursos: [{ id: 1, nombre: '1° A', horas, plan: [{ mid: 7, nombre: 'Matemática', h: 4 }] }],
      clases: [],
      profesores: [{ id_profesor: 1, nombre: 'A', apellido: 'B', documento: '1', activo: true, lista_materias_habilitadas: [{ id_materia: 7 }], disponibilidad }],
    });
    assert.equal(r.ubicadas, 4);
    assert.deepEqual(r.sinUbicar, []);
  });
});

describe('Pago', () => {
  test('referencia inexistente en otro servicio → 400 y no crea el pago', async () => {
    const r = await api('POST', 'pago', 'pagos', { id_profesor: 9999, periodo: '2026-09' });
    assert.equal(r.status, 400);
    assert.equal((await get('pago', 'pagos?id_profesor=9999')).datos.length, 0);
  });

  test('calcular_monto_a_liquidar coincide con el recibo del período', async () => {
    const r = await get('pago', 'profesores/1/monto-a-liquidar?periodo=2026-08');
    const rec = (await get('pago', 'recibos-de-sueldo?id_profesor=1&periodo=2026-08')).datos[0];
    assert.equal(r.datos.monto, rec.neto);
    assert.equal(rec.neto, 116424);
  });

  test('firma definitiva', async () => {
    const firmado = (await get('pago', 'recibos-de-sueldo?id_profesor=1')).datos.find((x) => x.firma_receptor);
    const r = await api('POST', 'pago', `recibos-de-sueldo/${firmado.id_recibo_sueldo}/firma`, { id_usuario: 10 });
    assert.equal(r.status, 409);
    const otra = (await get('pago', `recibos-de-sueldo?id_profesor=1&periodo=${firmado.periodo}`)).datos[0];
    assert.equal(otra.firma_receptor.fecha, firmado.firma_receptor.fecha);
  });

  test('descargar recibo en PDF', async () => {
    const r = await get('pago', 'recibos-de-sueldo/1/pdf');
    assert.equal(r.status, 200);
    assert.match(r.tipo, /application\/pdf/);
  });
});

describe('Generación automática de la planilla', () => {
  // Va al final (antes de tirar Orientación): completa la propuesta en Borrador de los seeds.
  test('generar_planilla solo en Borrador → 409', async () => {
    const otra = (await get('planificacion', 'propuestas')).datos.find((p) => p.estado.codigo !== 'BOR');
    const r = await api('POST', 'planificacion', `propuestas/${otra.id_propuesta}/generacion`, {});
    assert.equal(r.status, 409);
    assert.match(r.datos.mensaje, /solo se genera en Borrador/);
    assert.equal((await api('POST', 'planificacion', 'propuestas/99999/generacion', {})).status, 404);
  });

  test('id_curso de otro ciclo → 400', async () => {
    const borr = (await get('planificacion', 'propuestas')).datos.find((p) => p.estado.codigo === 'BOR');
    const r = await api('POST', 'planificacion', `propuestas/${borr.id_propuesta}/generacion`, { id_curso: 99999 });
    assert.equal(r.status, 400);
  });

  test('genera en la propuesta en Borrador: cada materia queda completa o se informa en sin_ubicar', async () => {
    const borr = (await get('planificacion', 'propuestas')).datos.find((p) => p.estado.codigo === 'BOR');
    const cursos = (await get('planificacion', `cursos?id_ciclo_lectivo=${borr.id_ciclo_lectivo}`)).datos;
    const horas = async () => {
      const m = new Map();
      for (const c of (await get('planificacion', `clases?id_propuesta=${borr.id_propuesta}`)).datos) {
        const k = c.id_curso + '|' + c.id_materia;
        m.set(k, (m.get(k) ?? 0) + c.ids_franjas_horarias.length);
      }
      return m;
    };
    const antes = await horas();
    const r = await api('POST', 'planificacion', `propuestas/${borr.id_propuesta}/generacion`, {});
    assert.equal(r.status, 200);
    assert.ok(r.datos.horas_ubicadas > 0);
    assert.ok(Array.isArray(r.datos.cambios) && Array.isArray(r.datos.errores));
    const despues = await horas();
    let total = 0;
    for (const c of cursos) {
      for (const m of c.materias) {
        const k = c.id_curso + '|' + m.id_materia;
        const ahora = despues.get(k) ?? 0;
        total += ahora - (antes.get(k) ?? 0);
        assert.ok(ahora >= (antes.get(k) ?? 0), `${k} perdió horas`);
        const falta = r.datos.sin_ubicar.find((x) => x.id_curso === c.id_curso && x.id_materia === m.id_materia)?.horas ?? 0;
        assert.ok(ahora + falta >= m.horas_semanales, `${k}: ${ahora} + ${falta} < ${m.horas_semanales}`);
      }
    }
    assert.equal(total, r.datos.horas_ubicadas);
    // Una segunda generación no tiene nada nuevo que ubicar en lo que ya quedó completo.
    const r2 = await api('POST', 'planificacion', `propuestas/${borr.id_propuesta}/generacion`, { id_curso: cursos[0].id_curso });
    assert.equal(r2.status, 200);
  });
});

describe('dependencias caídas', () => {
  test('si Orientación no responde, get_clase responde 503 en menos de 6 s', async () => {
    const i = Object.keys(SERVICIOS).indexOf('orientacion');
    procesos[i].kill();
    await new Promise((r) => setTimeout(r, 300));
    const t0 = Date.now();
    const r = await get('planificacion', 'clases/1');
    assert.equal(r.status, 503);
    assert.equal(r.datos.codigo, 'SERVICIO_NO_DISPONIBLE');
    assert.ok(Date.now() - t0 < 6000);
  });
});
