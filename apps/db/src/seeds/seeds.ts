import bcrypt from 'bcryptjs';
import type { DataSource, EntityManager, ObjectType } from 'typeorm';
import {
  AnioAcademicoEntidad,
  AreaEntidad,
  CicloLectivoEntidad,
  ClaseEntidad,
  ClaseFranjaEntidad,
  ClaseProfesorEntidad,
  ConceptoReciboEntidad,
  CursoEntidad,
  DiaLectivoEntidad,
  EstadoPropuestaEntidad,
  FranjaHorariaEntidad,
  MateriaClaseEntidad,
  MateriaCursoEntidad,
  MateriaEntidad,
  OrientacionCursoEntidad,
  OrientacionEntidad,
  PagoEntidad,
  ParametroPagoEntidad,
  PARAMETROS_PAGO_INICIALES,
  PrivilegioEntidad,
  ProfesorDisponibilidadEntidad,
  ProfesorEntidad,
  ProfesorMateriaEntidad,
  PropuestaClaseEntidad,
  PropuestaEntidad,
  ReciboSueldoEntidad,
  RolEntidad,
  SuplenciaClaseEntidad,
  SuplenciaEntidad,
  TurnoEntidad,
  UsuarioEntidad,
  ValorHoraEntidad,
  VALORES_HORA_INICIALES,
  liquidar,
} from '@sahs/entidades';
import * as D from './datos';

type Log = (msg: string) => void;

/** Corre el bloque solo si la tabla de la entidad está vacía (seeds idempotentes). */
async function siVacia<T>(m: EntityManager, entidad: ObjectType<T>, nombre: string, log: Log, fn: () => Promise<void>) {
  const n = await m.count(entidad as any);
  if (n > 0) {
    log(`  ${nombre}: ya tiene datos (${n}), no se carga`);
    return;
  }
  await fn();
  log(`  ${nombre}: cargado`);
}

/**
 * Carga los datos iniciales. Cada bloque se carga solo si su tabla está vacía, así que
 * correrlo dos veces no duplica ni modifica nada. Todo va en una transacción.
 */
export async function cargarSeeds(ds: DataSource, log: Log = console.log) {
  await ds.transaction(async (m) => {
    /* ---------- Usuario ---------- */
    await siVacia(m, PrivilegioEntidad, 'privilegios', log, async () => {
      await m.save(PrivilegioEntidad, D.PRIVILEGIOS.map(([id, d]) => ({ id_privilegio: id, descripcion_privilegio: d })));
    });
    await siVacia(m, RolEntidad, 'roles', log, async () => {
      for (const r of D.ROLES) {
        await m.save(RolEntidad, {
          id_rol: r.id,
          nombre_rol: r.nombre,
          privilegios: r.privilegios.map((id) => ({ id_privilegio: id }) as PrivilegioEntidad),
        });
      }
    });
    await siVacia(m, UsuarioEntidad, 'usuarios', log, async () => {
      const hash = await bcrypt.hash(D.CONTRASENIA_EJEMPLO, 10);
      for (const u of D.USUARIOS) {
        await m.insert(UsuarioEntidad, { id_usuario: u.id, nombre_user: u.nombre_user, email: u.email, id_rol: u.id_rol, contrasenia: hash });
      }
    });

    /* ---------- Horarios ---------- */
    // franjas[turno][día][posición del bloque] = id de la franja
    const franjas: Record<string, number[][]> = {};
    const horasDe: Record<string, (number | null)[][]> = {}; // horasDe[turno][día][hora-1] = id franja
    await siVacia(m, DiaLectivoEntidad, 'días, franjas y turnos', log, async () => {
      const dias = await m.save(DiaLectivoEntidad, D.DIAS.map((n, i) => ({ nombre_dia_lectivo: n, orden: i + 1 })));
      for (const t of D.TURNOS) {
        const bloques = D.bloquesDelTurno(t);
        const ids: FranjaHorariaEntidad[] = [];
        franjas[t.nombre] = [];
        horasDe[t.nombre] = [];
        for (const dia of dias) {
          const delDia: number[] = [];
          const horas: (number | null)[] = [];
          for (const b of bloques) {
            const f = await m.save(FranjaHorariaEntidad, {
              hora_inicio: b.inicio,
              hora_fin: b.fin,
              es_recreo: b.es_recreo,
              descripcion: b.es_recreo ? `Recreo · ${t.nombre}` : `${b.hora}ª hora · ${t.nombre}`,
              id_dia_lectivo: dia.id_dia_lectivo,
            });
            ids.push(f);
            delDia.push(f.id_franja_horaria);
            if (!b.es_recreo) horas.push(f.id_franja_horaria);
          }
          franjas[t.nombre].push(delDia);
          horasDe[t.nombre].push(horas);
        }
        await m.save(TurnoEntidad, {
          nombre: t.nombre,
          cantidad_franjas_total: ids.filter((f) => !f.es_recreo).length,
          franjas_horarias: ids,
        });
      }
    });
    // Si los horarios ya estaban, se reconstruye el mapa de horas desde la base.
    if (!Object.keys(horasDe).length) {
      const turnos = await m.find(TurnoEntidad, { relations: { franjas_horarias: { dia_lectivo: true } } });
      for (const t of turnos) {
        const porDia: (number | null)[][] = D.DIAS.map(() => []);
        const orden = [...t.franjas_horarias]
          .filter((f) => !f.es_recreo)
          .sort((a, b) => a.id_dia_lectivo - b.id_dia_lectivo || a.hora_inicio.localeCompare(b.hora_inicio));
        for (const f of orden) porDia[(f.dia_lectivo?.orden ?? 1) - 1].push(f.id_franja_horaria);
        horasDe[t.nombre] = porDia;
      }
    }

    /* ---------- Planificación (catálogos) ---------- */
    await siVacia(m, EstadoPropuestaEntidad, 'estados de propuesta', log, async () => {
      await m.save(EstadoPropuestaEntidad, D.ESTADOS_PROPUESTA);
    });
    await siVacia(m, CicloLectivoEntidad, 'ciclos lectivos', log, async () => {
      await m.save(CicloLectivoEntidad, D.CICLOS.map((a) => ({ anio_calendario: a })));
    });
    await siVacia(m, AnioAcademicoEntidad, 'años académicos', log, async () => {
      await m.save(AnioAcademicoEntidad, D.ANIOS_ACADEMICOS.map((a) => ({ anio_curricular: a.nombre, codigo: a.codigo })));
    });
    const anios = new Map((await m.find(AnioAcademicoEntidad)).map((a) => [a.codigo, a.id_anio_academico]));
    const anioId = (n: number) => anios.get(D.ANIOS_ACADEMICOS[n - 1].codigo)!;
    const ciclos = new Map((await m.find(CicloLectivoEntidad)).map((c) => [c.anio_calendario, c.id_ciclo_lectivo]));
    const estados = new Map((await m.find(EstadoPropuestaEntidad)).map((e) => [e.codigo, e.id_estado]));

    /* ---------- Profesores ---------- */
    const profes = new Map<string, number>();
    await siVacia(m, ProfesorEntidad, 'profesores', log, async () => {
      for (const p of D.PROFESORES) {
        const e = await m.save(ProfesorEntidad, {
          nombre: p.nombre, apellido: p.apellido, documento: p.documento, legajo: p.legajo, cargo_asociado: p.cargo,
          correo_electronico: p.correo, telefono: p.telefono, direccion: p.direccion, id_usuario: p.usr,
        });
        profes.set(p.clave, e.id_profesor);
        // Disponibilidad: Mañana (primeras 6 horas) y Doble turno (10 horas).
        const disp: { id_profesor: number; id_franja_horaria: number }[] = [];
        const agregar = (turno: string, filas: string[]) => {
          (horasDe[turno] || []).forEach((horas, d) =>
            horas.forEach((id, h) => {
              if (id && (filas[d] || '').charAt(h) === '1') disp.push({ id_profesor: e.id_profesor, id_franja_horaria: id });
            }),
          );
        };
        agregar('Mañana', p.dispM);
        agregar('Doble turno', p.dispD);
        if (disp.length) await m.insert(ProfesorDisponibilidadEntidad, disp);
      }
    });
    if (!profes.size) {
      for (const p of await m.find(ProfesorEntidad)) {
        const d = D.PROFESORES.find((x) => x.legajo === p.legajo);
        if (d) profes.set(d.clave, p.id_profesor);
      }
    }

    /* ---------- Orientación ---------- */
    const orients = new Map<string, number>();
    const materias = new Map<string, number>();
    await siVacia(m, OrientacionEntidad, 'orientaciones, áreas y materias', log, async () => {
      for (const o of D.ORIENTACIONES) {
        const e = await m.save(OrientacionEntidad, { nombre_orientacion: o.nombre, codigo: o.codigo, descripcion_orientacion: o.desc });
        orients.set(o.nombre, e.id_orientacion);
      }
      const areas = new Map<string, number>();
      for (const a of D.AREAS) {
        const e = await m.save(AreaEntidad, { nombre_area: a.nombre, descripcion_area: a.desc, id_profesor_coordinador: profes.get(a.coord) ?? null });
        areas.set(a.nombre, e.id_area);
      }
      for (const mt of D.MATERIAS) {
        const e = await m.save(MateriaEntidad, {
          nombre_materia: mt.n, descripcion_materia: mt.d, horas_semanales: mt.h,
          id_area: mt.ar ? areas.get(mt.ar)! : null, id_orientacion: orients.get(mt.o)!, id_anio_academico: anioId(mt.a),
        });
        materias.set(mt.clave, e.id_materia);
      }
      // Materias habilitadas de cada profesor.
      const hab: { id_profesor: number; id_materia: number }[] = [];
      for (const mt of D.MATERIAS) for (const c of mt.doc) if (profes.has(c)) hab.push({ id_profesor: profes.get(c)!, id_materia: materias.get(mt.clave)! });
      if (hab.length && (await m.count(ProfesorMateriaEntidad)) === 0) await m.insert(ProfesorMateriaEntidad, hab);
    });
    if (!materias.size) {
      const lista = await m.find(MateriaEntidad, { relations: { orientacion: true } });
      for (const mt of D.MATERIAS) {
        const e = lista.find((x) => x.nombre_materia === mt.n && x.id_anio_academico === anioId(mt.a) && x.orientacion?.nombre_orientacion === mt.o);
        if (e) materias.set(mt.clave, e.id_materia);
      }
      for (const o of await m.find(OrientacionEntidad)) orients.set(o.nombre_orientacion, o.id_orientacion);
    }

    /* ---------- Cursos ---------- */
    const cursos = new Map<string, number>();
    const turnos = new Map((await m.find(TurnoEntidad)).map((t) => [t.nombre, t.id_turno]));
    await siVacia(m, CursoEntidad, 'cursos', log, async () => {
      for (const c of D.CURSOS) {
        const e = await m.save(CursoEntidad, {
          division: c.div, id_anio_academico: anioId(c.anio), id_ciclo_lectivo: ciclos.get(c.ciclo)!, id_turno: turnos.get(c.turno)!,
        });
        cursos.set(c.clave, e.id_curso);
        await m.insert(OrientacionCursoEntidad, { id_curso: e.id_curso, id_orientacion: orients.get(c.orientacion)! });
        await m.insert(
          MateriaCursoEntidad,
          c.materias.map((k) => ({ id_curso: e.id_curso, id_materia: materias.get(k)!, horas_semanales: D.MATERIAS.find((x) => x.clave === k)!.h })),
        );
      }
    });
    if (!cursos.size) {
      const lista = await m.find(CursoEntidad, { relations: { anio_academico: true, ciclo_lectivo: true } });
      for (const c of D.CURSOS) {
        const e = lista.find((x) => x.division === c.div && x.ciclo_lectivo?.anio_calendario === c.ciclo && x.anio_academico?.codigo === D.ANIOS_ACADEMICOS[c.anio - 1].codigo);
        if (e) cursos.set(c.clave, e.id_curso);
      }
    }

    /* ---------- Propuestas y clases ---------- */
    // clasesPor[propuesta|curso|materia] = id de la clase
    const clasesPor = new Map<string, number>();
    await siVacia(m, PropuestaEntidad, 'propuestas y clases', log, async () => {
      const dt = horasDe['Doble turno'];
      for (const p of D.PROPUESTAS) {
        const prop = await m.save(PropuestaEntidad, {
          nombre: p.nombre, codigo: p.codigo, descripcion_propuesta: p.desc, id_ciclo_lectivo: ciclos.get(p.ciclo)!,
          id_estado: estados.get(p.estado)!, fecha_creacion: p.creada, fecha_modificacion: p.creada,
        });
        for (const [cursoClave, grilla] of p.grillas) {
          const idCurso = cursos.get(cursoClave)!;
          const porMateria = new Map<string, number[]>();
          D.GRILLAS[grilla].forEach((fila, d) =>
            fila.forEach((k, h) => {
              if (!k) return;
              const id = dt[d][h];
              if (!id) return;
              if (!porMateria.has(k)) porMateria.set(k, []);
              porMateria.get(k)!.push(id);
            }),
          );
          for (const [k, ids] of porMateria) {
            const mt = D.MATERIAS.find((x) => x.clave === k)!;
            const cod = `${p.codigo.slice(5)}-${cursoClave.slice(0, 2)}-${mt.n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 3).toUpperCase()}`;
            const clase = await m.save(ClaseEntidad, {
              codigo: cod,
              descripcion: `${mt.n} · ${cursoClave.slice(0, 1)}° ${cursoClave.slice(1, 2)}`,
              id_curso: idCurso,
              id_materia: materias.get(k)!,
            });
            await m.insert(ClaseFranjaEntidad, ids.map((id) => ({ id_clase: clase.id_clase, id_franja_horaria: id })));
            await m.insert(ClaseProfesorEntidad, D.DOCENTES_GRILLA[k].map((c) => ({ id_clase: clase.id_clase, id_profesor: profes.get(c)! })));
            await m.insert(PropuestaClaseEntidad, { id_propuesta: prop.id_propuesta, id_clase: clase.id_clase });
            await m.insert(MateriaClaseEntidad, { id_clase: clase.id_clase, id_materia: materias.get(k)! });
            clasesPor.set(`${p.codigo}|${cursoClave}|${k}`, clase.id_clase);
          }
        }
      }
    });

    /* ---------- Suplencias ---------- */
    await siVacia(m, SuplenciaEntidad, 'suplencias', log, async () => {
      for (const s of D.SUPLENCIAS) {
        const ids = s.clases.map(([p, c, k]) => clasesPor.get(`${p}|${c}|${k}`)).filter((x): x is number => !!x);
        if (!ids.length) continue;
        const sup = await m.save(SuplenciaEntidad, { fecha_inicio: s.desde, fecha_fin: s.hasta, motivo: s.motivo, id_profesor: profes.get(s.suplente)! });
        await m.insert(SuplenciaClaseEntidad, ids.map((id) => ({ id_suplencia: sup.id_suplencia, id_clase: id })));
      }
    });

    /* ---------- Pago ---------- */
    await siVacia(m, ParametroPagoEntidad, 'parámetros de liquidación', log, async () => {
      await m.save(ParametroPagoEntidad, Object.entries(PARAMETROS_PAGO_INICIALES).map(([clave, valor]) => ({ clave, valor })));
      await m.save(ValorHoraEntidad, VALORES_HORA_INICIALES.map(([desde_periodo, valor]) => ({ desde_periodo, valor })));
    });
    await siVacia(m, PagoEntidad, 'pagos y recibos', log, async () => {
      const param = new Map((await m.find(ParametroPagoEntidad)).map((x) => [x.clave, x.valor]));
      const valores = (await m.find(ValorHoraEntidad)).sort((a, b) => a.desde_periodo.localeCompare(b.desde_periodo));
      for (const pg of D.PAGOS) {
        const idProf = profes.get(pg.profesor)!;
        // Horas del profesor en la propuesta vigente (PLAN-2026-01), agrupadas por materia.
        const horas: { descripcion: string; horas: number }[] = [];
        for (const k of Object.keys(D.DOCENTES_GRILLA)) {
          if (!D.DOCENTES_GRILLA[k].includes(pg.profesor)) continue;
          const cursosConHoras: string[] = [];
          let total = 0;
          for (const [cursoClave, grilla] of D.PROPUESTAS.find((p) => p.codigo === 'PLAN-2026-01')!.grillas) {
            const n = D.GRILLAS[grilla].flat().filter((x) => x === k).length;
            if (n) {
              total += n;
              cursosConHoras.push(`${cursoClave.slice(0, 1)}° ${cursoClave.slice(1, 2)}`);
            }
          }
          if (total) horas.push({ descripcion: `${D.MATERIAS.find((x) => x.clave === k)!.n} (${cursosConHoras.join(' y ')})`, horas: total });
        }
        const valor = [...valores].reverse().find((v) => v.desde_periodo <= pg.periodo)?.valor ?? 0;
        const liq = liquidar(horas, pg.periodo, {
          valor_hora: valor,
          antiguedad_pct: Number(param.get('antiguedad_pct')),
          jubilacion_pct: Number(param.get('jubilacion_pct')),
          obra_social_pct: Number(param.get('obra_social_pct')),
          sindical_pct: Number(param.get('sindical_pct')),
        });
        const pago = await m.save(PagoEntidad, { id_profesor: idProf, periodo: pg.periodo, validado: true });
        await m.save(ReciboSueldoEntidad, {
          id_pago: pago.id_pago, id_profesor: idProf, periodo: pg.periodo, fecha_pago: pg.fecha_pago,
          emisor_razon_social: param.get('emisor_razon_social')!, emisor_cuit: param.get('emisor_cuit')!,
          total_bruto: liq.total_bruto, total_descuentos: liq.total_descuentos, neto: liq.neto,
          firma_emisor_id_usuario: 1, firma_emisor_fecha: pg.fecha_pago + 'T09:00:00.000Z',
          firma_receptor_id_usuario: pg.firmado ? D.PROFESORES.find((p) => p.clave === pg.profesor)!.usr : null,
          firma_receptor_fecha: pg.firmado,
          conceptos: liq.conceptos.map((c, i) => ({ ...c, orden: i }) as ConceptoReciboEntidad),
        });
      }
    });
  });
}
