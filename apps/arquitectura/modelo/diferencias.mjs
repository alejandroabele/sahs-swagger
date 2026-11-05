/**
 * Diferencias entre el modelo generado del código (generado.json) y el que validó una
 * persona (validado.json). Lo usan tools/arquitectura.mjs y la app, así que es JS puro,
 * sin dependencias.
 *
 * Una diferencia es { clave, tipo, cambio, descripcion, origen, ... }:
 *   tipo   'servicio' | 'llamada' | 'contenedor' | 'tablas'
 *   cambio 'nuevo' | 'eliminado' | 'cambiado'
 */

const claveLlamada = (l) => `${l.de}>${l.a}`;

export function diferencias(generado, validado) {
  const lista = [];

  const svcGen = new Map(generado.servicios.map((s) => [s.id, s]));
  const svcVal = new Map(validado.servicios.map((s) => [s.id, s]));
  for (const [id] of svcGen) {
    if (!svcVal.has(id)) {
      lista.push({ clave: `servicio:${id}`, tipo: 'servicio', cambio: 'nuevo', id, descripcion: id, origen: 'docker-compose.yml' });
    }
  }
  for (const [id] of svcVal) {
    if (!svcGen.has(id)) {
      lista.push({ clave: `servicio:${id}`, tipo: 'servicio', cambio: 'eliminado', id, descripcion: id, origen: 'docker-compose.yml' });
    }
  }
  for (const [id, gen] of svcGen) {
    const val = svcVal.get(id);
    if (!val) continue;
    const antes = new Set(val.tablas ?? []);
    const ahora = new Set(gen.tablas);
    const agregadas = [...ahora].filter((t) => !antes.has(t));
    const quitadas = [...antes].filter((t) => !ahora.has(t));
    if (agregadas.length || quitadas.length) {
      const partes = [];
      if (agregadas.length) partes.push(`+ ${agregadas.join(', ')}`);
      if (quitadas.length) partes.push(`− ${quitadas.join(', ')}`);
      lista.push({
        clave: `tablas:${id}`, tipo: 'tablas', cambio: 'cambiado', id, agregadas, quitadas,
        descripcion: `${id}: ${partes.join(' · ')}`, origen: `libs/entidades/src/${id}`,
      });
    }
  }

  const llGen = new Map(generado.llamadas.map((l) => [claveLlamada(l), l]));
  const llVal = new Map(validado.llamadas.map((l) => [claveLlamada(l), l]));
  for (const [k, l] of llGen) {
    if (!llVal.has(k)) {
      lista.push({ clave: `llamada:${k}`, tipo: 'llamada', cambio: 'nuevo', de: l.de, a: l.a, descripcion: `${l.de} → ${l.a}`, origen: `apps/${l.de}/src` });
    }
  }
  for (const [k, l] of llVal) {
    if (!llGen.has(k)) {
      lista.push({ clave: `llamada:${k}`, tipo: 'llamada', cambio: 'eliminado', de: l.de, a: l.a, descripcion: `${l.de} → ${l.a}`, origen: `apps/${l.de}/src` });
    }
  }

  const ctGen = new Set(generado.contenedores);
  const ctVal = new Set(validado.contenedores);
  for (const c of ctGen) {
    if (!ctVal.has(c)) lista.push({ clave: `contenedor:${c}`, tipo: 'contenedor', cambio: 'nuevo', id: c, descripcion: c, origen: 'docker-compose.yml' });
  }
  for (const c of ctVal) {
    if (!ctGen.has(c)) lista.push({ clave: `contenedor:${c}`, tipo: 'contenedor', cambio: 'eliminado', id: c, descripcion: c, origen: 'docker-compose.yml' });
  }

  return lista;
}

/** Devuelve una copia de `validado` con la diferencia aprobada. */
export function aplicar(validado, dif, generado) {
  const v = structuredClone(validado);
  if (dif.tipo === 'servicio' && dif.cambio === 'nuevo') {
    const gen = generado.servicios.find((s) => s.id === dif.id);
    // Nombre y descripción los completa una persona; el ícono por defecto es el genérico.
    v.servicios.push({ id: dif.id, nombre: dif.id, descripcion: '', icono: 'servicio', tablas: gen?.tablas ?? [] });
  } else if (dif.tipo === 'servicio') {
    v.servicios = v.servicios.filter((s) => s.id !== dif.id);
  } else if (dif.tipo === 'tablas') {
    const gen = generado.servicios.find((s) => s.id === dif.id);
    const s = v.servicios.find((x) => x.id === dif.id);
    if (s && gen) s.tablas = [...gen.tablas];
  } else if (dif.tipo === 'llamada' && dif.cambio === 'nuevo') {
    v.llamadas.push({ de: dif.de, a: dif.a });
  } else if (dif.tipo === 'llamada') {
    v.llamadas = v.llamadas.filter((l) => !(l.de === dif.de && l.a === dif.a));
  } else if (dif.tipo === 'contenedor' && dif.cambio === 'nuevo') {
    v.contenedores.push(dif.id);
  } else if (dif.tipo === 'contenedor') {
    v.contenedores = v.contenedores.filter((c) => c !== dif.id);
  }
  return v;
}
