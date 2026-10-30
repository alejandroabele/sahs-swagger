/**
 * Datos de ejemplo de SAHS: Instituto Don Bosco de Neuquén, ciclos 2025 y 2026.
 * Salen de ../datos-de-ejemplo.md y del prototipo (prototipo/index.html). Cuando el
 * prototipo y el documento no coinciden, manda el prototipo, porque es lo que muestra la web.
 */

/* ---------- Usuario ---------- */

export const PRIVILEGIOS: [number, string][] = [
  [1, 'Planificación anual'],
  [2, 'Recibos de sueldo'],
  [3, 'Materias'],
  [4, 'Profesores'],
  [5, 'Cursos'],
  [6, 'Áreas'],
  [7, 'Turnos y franjas'],
  [8, 'Cambio de clase'],
  [9, 'Usuarios'],
  [10, 'Orientaciones'],
  [11, 'Ciclos lectivos'],
  [12, 'Mi grilla horaria'],
  [13, 'Mi disponibilidad'],
  [14, 'Mis recibos'],
  [15, 'Disponibilidad de profesores'],
];

export const ROLES: { id: number; nombre: string; privilegios: number[] }[] = [
  { id: 1, nombre: 'Administrativo', privilegios: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15] },
  { id: 2, nombre: 'Profesor', privilegios: [12, 13, 14] },
  { id: 3, nombre: 'Coordinador de área', privilegios: [1, 3, 4, 6, 12, 13, 14] },
];

export const CONTRASENIA_EJEMPLO = 'sahs2026';

export const USUARIOS: { id: number; nombre_user: string; email: string; id_rol: number }[] = [
  { id: 1, nombre_user: 'secretaria', email: 'secretaria@donbosco.edu.ar', id_rol: 1 },
  { id: 2, nombre_user: 'mlopez', email: 'mlopez@donbosco.edu.ar', id_rol: 1 },
  { id: 10, nombre_user: 'jramirez', email: 'jramirez@donbosco.edu.ar', id_rol: 2 },
  { id: 11, nombre_user: 'aguido', email: 'aguido@donbosco.edu.ar', id_rol: 2 },
  { id: 12, nombre_user: 'jgonzalez', email: 'jgonzalez@donbosco.edu.ar', id_rol: 2 },
  { id: 13, nombre_user: 'mbernal', email: 'mbernal@donbosco.edu.ar', id_rol: 2 },
  { id: 14, nombre_user: 'sferreyra', email: 'sferreyra@donbosco.edu.ar', id_rol: 3 },
  { id: 15, nombre_user: 'hvillalba', email: 'hvillalba@donbosco.edu.ar', id_rol: 2 },
  { id: 16, nombre_user: 'mperez', email: 'mperez@donbosco.edu.ar', id_rol: 2 },
  { id: 17, nombre_user: 'rinsua', email: 'rinsua@donbosco.edu.ar', id_rol: 2 },
];

/* ---------- Horarios ---------- */

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

/** Turnos del prototipo: horas de `dur` minutos y un recreo de `recreo` minutos cada `cada` horas. */
export const TURNOS = [
  { nombre: 'Mañana', inicio: '08:00', fin: '12:30', dur: 40, recreo: 10, cada: 2 },
  { nombre: 'Tarde', inicio: '13:00', fin: '18:30', dur: 40, recreo: 10, cada: 2 },
  { nombre: 'Nocturno', inicio: '20:00', fin: '23:30', dur: 40, recreo: 10, cada: 2 },
  { nombre: 'Doble turno', inicio: '08:00', fin: '16:00', dur: 40, recreo: 10, cada: 2 },
];

export interface Bloque {
  inicio: string;
  fin: string;
  es_recreo: boolean;
  /** Número de hora cátedra (1, 2, …); null en los recreos. */
  hora: number | null;
}

/** Bloques de un día del turno: horas cátedra y, entre dos que no vienen seguidas, un recreo. */
export function bloquesDelTurno(t: (typeof TURNOS)[number]): Bloque[] {
  const aMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const aTxt = (m: number) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  let tt = aMin(t.inicio);
  const tope = aMin(t.fin);
  const horas: [number, number][] = [];
  let n = 0;
  while (tt + t.dur <= tope && horas.length < 16) {
    horas.push([tt, tt + t.dur]);
    tt += t.dur;
    n++;
    if (t.cada > 0 && n % t.cada === 0) tt += t.recreo;
  }
  const out: Bloque[] = [];
  let h = 0;
  horas.forEach((f, k) => {
    if (k > 0 && horas[k - 1][1] !== f[0]) out.push({ inicio: aTxt(horas[k - 1][1]), fin: aTxt(f[0]), es_recreo: true, hora: null });
    out.push({ inicio: aTxt(f[0]), fin: aTxt(f[1]), es_recreo: false, hora: ++h });
  });
  return out;
}

/* ---------- Orientación ---------- */

export const ORIENTACIONES = [
  { nombre: 'Básica', codigo: 'BAS', desc: 'Ciclo básico e intermedio. Es la orientación de todos los cursos de 1° a 3° año.' },
  { nombre: 'Economía', codigo: 'ECO', desc: 'Gestión de las organizaciones, contabilidad y economía.' },
  { nombre: 'Educación', codigo: 'EDU', desc: 'Formación orientada a la enseñanza: pedagogía, psicología y didáctica.' },
  { nombre: 'Educación Física', codigo: 'EFI', desc: 'Deporte, cuerpo y salud, con prácticas de entrenamiento.' },
];

/** Áreas con su coordinador (clave del profesor). */
export const AREAS = [
  { nombre: 'Exactas', desc: 'Matemática, ciencias naturales e informática', coord: 'jr' },
  { nombre: 'Lengua y Literatura', desc: 'Lengua materna y lenguas extranjeras', coord: 'mp' },
  { nombre: 'Sociales', desc: 'Historia, Geografía, Contabilidad y EPA', coord: 'rs' },
  { nombre: 'Pastoral', desc: 'Formación religiosa salesiana', coord: 'hv' },
  { nombre: 'Artes', desc: 'Expresión plástica y visual', coord: 'mb' },
];

/** Catálogo de materias del prototipo. doc: profesores habilitados (en orden de preferencia). */
export const MATERIAS: { clave: string; n: string; a: number; o: string; ar: string; h: number; doc: string[]; d: string }[] = [
  { clave: 'mat1', n: 'Matemática', a: 1, o: 'Básica', ar: 'Exactas', h: 5, doc: ['jr', 'aa'], d: 'Números, operaciones, ecuaciones y geometría básica.' },
  { clave: 'len1', n: 'Lengua', a: 1, o: 'Básica', ar: 'Lengua y Literatura', h: 4, doc: ['mp', 'ri'], d: 'Comprensión lectora, producción de textos y gramática.' },
  { clave: 'his1', n: 'Historia', a: 1, o: 'Básica', ar: 'Sociales', h: 3, doc: ['rs', 'ap'], d: 'Desde los pueblos originarios hasta la organización nacional.' },
  { clave: 'geo1', n: 'Geografía', a: 1, o: 'Básica', ar: 'Sociales', h: 3, doc: ['ap', 'rs'], d: 'Geografía física y política de Argentina.' },
  { clave: 'inf1', n: 'Informática', a: 1, o: 'Básica', ar: 'Exactas', h: 3, doc: ['aa', 'jr'], d: 'Herramientas de ofimática y pensamiento computacional.' },
  { clave: 'ing1', n: 'Inglés', a: 1, o: 'Básica', ar: 'Lengua y Literatura', h: 3, doc: ['ri', 'mp'], d: 'Nivel inicial: vocabulario, presente simple y diálogos.' },
  { clave: 'fis1', n: 'Física', a: 1, o: 'Básica', ar: 'Exactas', h: 2, doc: ['ag', 'jg'], d: 'Movimiento, fuerzas y energía.' },
  { clave: 'qui1', n: 'Química', a: 1, o: 'Básica', ar: 'Exactas', h: 2, doc: ['jg', 'ag'], d: 'Materia, mezclas y tabla periódica.' },
  { clave: 'cat1', n: 'Catequesis', a: 1, o: 'Básica', ar: 'Pastoral', h: 2, doc: ['hv'], d: 'Formación en la espiritualidad salesiana.' },
  { clave: 'art1', n: 'Artística', a: 1, o: 'Básica', ar: 'Artes', h: 2, doc: ['mb'], d: 'Expresión plástica y lenguaje visual.' },
  { clave: 'epa1', n: 'EPA Sociales', a: 1, o: 'Básica', ar: 'Sociales', h: 2, doc: ['rs', 'ap'], d: 'Espacio de propuesta de área dictado por varios profesores.' },
  { clave: 'mat2', n: 'Matemática', a: 2, o: 'Básica', ar: 'Exactas', h: 5, doc: ['aa', 'jr'], d: 'Funciones, proporcionalidad y estadística.' },
  { clave: 'fra2', n: 'Francés', a: 2, o: 'Básica', ar: 'Lengua y Literatura', h: 2, doc: [], d: 'Nivel inicial: pronunciación y expresiones cotidianas.' },
  { clave: 'mat4eco', n: 'Matemática', a: 4, o: 'Economía', ar: 'Exactas', h: 5, doc: ['jr', 'aa'], d: 'Funciones exponenciales, interés simple y compuesto.' },
  { clave: 'con4eco', n: 'Contabilidad', a: 4, o: 'Economía', ar: 'Sociales', h: 2, doc: ['lt'], d: 'Registración contable y análisis de estados básicos.' },
  { clave: 'eco4eco', n: 'Economía', a: 4, o: 'Economía', ar: 'Sociales', h: 3, doc: ['lt'], d: 'Mercado, oferta y demanda, e indicadores económicos.' },
  { clave: 'mat5eco', n: 'Matemática', a: 5, o: 'Economía', ar: 'Exactas', h: 4, doc: ['jr', 'aa'], d: 'Matemática financiera.' },
  { clave: 'der5eco', n: 'Derecho', a: 5, o: 'Economía', ar: '', h: 2, doc: [], d: 'Nociones de derecho civil y comercial.' },
  { clave: 'mat4edu', n: 'Matemática', a: 4, o: 'Educación', ar: 'Exactas', h: 4, doc: ['aa', 'jr'], d: 'Funciones, estadística y su enseñanza.' },
  { clave: 'ped4edu', n: 'Pedagogía', a: 4, o: 'Educación', ar: 'Sociales', h: 3, doc: ['sf'], d: 'Teorías del aprendizaje y el rol docente.' },
  { clave: 'psi4edu', n: 'Psicología', a: 4, o: 'Educación', ar: 'Sociales', h: 3, doc: ['sf'], d: 'Desarrollo psicológico en la infancia y la adolescencia.' },
  { clave: 'mat4efi', n: 'Matemática', a: 4, o: 'Educación Física', ar: 'Exactas', h: 3, doc: ['jr'], d: 'Funciones y estadística aplicada al deporte.' },
  { clave: 'ana4efi', n: 'Anatomía', a: 4, o: 'Educación Física', ar: 'Exactas', h: 3, doc: ['ag'], d: 'Sistemas del cuerpo humano y movimiento.' },
  { clave: 'ent4efi', n: 'Entrenamiento deportivo', a: 4, o: 'Educación Física', ar: '', h: 4, doc: [], d: 'Planificación del entrenamiento y prácticas deportivas.' },
];

/* ---------- Profesor y Suplencias ---------- */

/**
 * Profesores (ficha A9 del prototipo). usr: id del usuario vinculado.
 * dispM: disponibilidad en el turno Mañana (una fila por día, '1' = disponible en esa hora).
 * dispD: disponibilidad en el Doble turno (pantalla Suplencias, A4).
 */
export const PROFESORES: {
  clave: string; nombre: string; apellido: string; documento: string; legajo: string; cargo: string;
  correo: string; telefono: string; direccion: string; usr: number | null; dispM: string[]; dispD: string[];
}[] = [
  { clave: 'jr', nombre: 'Juan', apellido: 'Ramírez', documento: '30.123.456', legajo: 'FAI-3388', cargo: 'Profesor titular', correo: 'j.ramirez@donbosco.edu.ar', telefono: '299 415-2210', direccion: 'Chaneton 780, Neuquén', usr: 10,
    dispM: ['1111100', '1111100', '1111000', '1111100', '1111000'], dispD: ['1111100110', '1111100000', '1111000100', '1111100011', '1111000000'] },
  { clave: 'mp', nombre: 'Mariela', apellido: 'Pérez', documento: '28.456.789', legajo: 'FAI-1204', cargo: 'Profesora titular', correo: 'm.perez@donbosco.edu.ar', telefono: '299 466-0187', direccion: 'Belgrano 1442, Neuquén', usr: 16,
    dispM: ['0011111', '1111100', '0011111', '1111100', '0011100'], dispD: ['0011111000', '1111100110', '0011111000', '1111100000', '0011100100'] },
  { clave: 'rs', nombre: 'Roberto', apellido: 'Sánchez', documento: '25.987.654', legajo: 'FAI-0876', cargo: 'Profesor titular', correo: 'r.sanchez@donbosco.edu.ar', telefono: '299 443-7756', direccion: 'Alderete 235, Neuquén', usr: null,
    dispM: ['1111000', '0011111', '1111100', '0011111', '1111000'], dispD: ['1111000001', '0011111000', '1111100011', '0011111000', '1111000000'] },
  { clave: 'ap', nombre: 'Ángel', apellido: 'Paz', documento: '31.204.887', legajo: 'FAI-2210', cargo: 'Profesor interino', correo: 'a.paz@donbosco.edu.ar', telefono: '299 478-3390', direccion: 'Rioja 655, Neuquén', usr: null,
    dispM: ['1111000', '1111100', '1111100', '0011111', '1111000'], dispD: ['1111000000', '1111100000', '1111100000', '0011111000', '1111000000'] },
  { clave: 'aa', nombre: 'Ángel', apellido: 'Avellaneda', documento: '33.772.104', legajo: 'FAI-3242', cargo: 'Profesor titular', correo: 'a.avellaneda@donbosco.edu.ar', telefono: '299 490-1128', direccion: 'Perito Moreno 90, Neuquén', usr: null,
    dispM: ['0011111', '0011111', '1111100', '1111100', '0011111'], dispD: ['0011111111', '0011111000', '1111100000', '1111100111', '0011111000'] },
  { clave: 'ag', nombre: 'Adriano', apellido: 'Guido', documento: '34.118.720', legajo: 'FAI-4128', cargo: 'Profesor interino', correo: 'a.guido@donbosco.edu.ar', telefono: '299 402-6634', direccion: 'Lanín 1120, Neuquén', usr: 11,
    dispM: ['1111100', '0000000', '1111100', '0000000', '1111100'], dispD: ['1111100000', '0000000000', '1111100000', '0000000000', '1111100000'] },
  { clave: 'jg', nombre: 'Javier', apellido: 'González', documento: '29.640.331', legajo: 'FAI-1877', cargo: 'Profesor titular', correo: 'j.gonzalez@donbosco.edu.ar', telefono: '299 455-9042', direccion: 'Entre Ríos 340, Neuquén', usr: 12,
    dispM: ['0000000', '1111100', '0000000', '1111100', '0011111'], dispD: ['0000000000', '1111100000', '0000000000', '1111100000', '0011111000'] },
  { clave: 'ri', nombre: 'Romina', apellido: 'Insúa', documento: '32.509.663', legajo: 'FAI-2995', cargo: 'Profesora interina', correo: 'r.insua@donbosco.edu.ar', telefono: '299 481-5573', direccion: 'Tucumán 76, Neuquén', usr: 17,
    dispM: ['1111100', '1111100', '0011111', '0011111', '1111100'], dispD: ['1111100000', '1111100111', '0011111000', '0011111000', '1111100000'] },
  { clave: 'hv', nombre: 'Marcelo', apellido: 'Villalba', documento: '24.330.918', legajo: 'FAI-0412', cargo: 'Coordinador de pastoral', correo: 'm.villalba@donbosco.edu.ar', telefono: '299 447-2280', direccion: 'Chaneton 599, Neuquén', usr: 15,
    dispM: ['1111100', '1111100', '1111100', '1111100', '1111100'], dispD: ['1111100000', '1111100000', '1111100000', '1111100000', '1111100000'] },
  { clave: 'mb', nombre: 'Miguel', apellido: 'Bernal', documento: '30.887.442', legajo: 'FAI-1530', cargo: 'Profesor titular', correo: 'm.bernal@donbosco.edu.ar', telefono: '299 469-3318', direccion: 'Santa Fe 1205, Neuquén', usr: 13,
    dispM: ['1111000', '0000000', '1111000', '0000000', '1111000'], dispD: ['1111000000', '0000000000', '1111000000', '0000000000', '1111000000'] },
  { clave: 'lt', nombre: 'Luca', apellido: 'Tocce', documento: '33.418.902', legajo: 'FAI-3105', cargo: 'Profesor titular', correo: 'l.tocce@donbosco.edu.ar', telefono: '299 437-8812', direccion: 'Mitre 410, Neuquén', usr: null,
    dispM: ['0011111', '0011111', '0011100', '0011111', '0011100'], dispD: ['0000000000', '0000000000', '0000000000', '0000000000', '0000000000'] },
  { clave: 'sf', nombre: 'Silvia', apellido: 'Ferreyra', documento: '35.118.402', legajo: 'FAI-5120', cargo: 'Coordinadora de área', correo: 's.ferreyra@donbosco.edu.ar', telefono: '299 421-0954', direccion: 'Sarmiento 233, Neuquén', usr: 14,
    dispM: ['1111111', '1111100', '0011111', '1111100', '1111111'], dispD: ['0000000000', '0000000000', '0000000000', '0000000000', '0000000000'] },
];

/* ---------- Planificación ---------- */

export const ANIOS_ACADEMICOS = [
  { anio: 1, nombre: '1° año', codigo: '1ER' },
  { anio: 2, nombre: '2° año', codigo: '2DO' },
  { anio: 3, nombre: '3° año', codigo: '3ER' },
  { anio: 4, nombre: '4° año', codigo: '4TO' },
  { anio: 5, nombre: '5° año', codigo: '5TO' },
];

export const ESTADOS_PROPUESTA = [
  { nombre: 'Borrador', codigo: 'BOR' },
  { nombre: 'En revisión', codigo: 'REV' },
  { nombre: 'Vigente', codigo: 'VIG' },
  { nombre: 'Fue vigente', codigo: 'FVG' },
];

export const CICLOS = [2025, 2026];

/** Cursos (A10). materias: claves del catálogo que dicta el curso. */
export const CURSOS: { clave: string; anio: number; div: string; ciclo: number; turno: string; orientacion: string; materias: string[] }[] = (() => {
  const primero = ['mat1', 'len1', 'his1', 'geo1', 'inf1', 'ing1', 'fis1', 'qui1', 'cat1', 'art1', 'epa1'];
  return [
    { clave: '1A-2026', anio: 1, div: 'A', ciclo: 2026, turno: 'Doble turno', orientacion: 'Básica', materias: primero },
    { clave: '1B-2026', anio: 1, div: 'B', ciclo: 2026, turno: 'Doble turno', orientacion: 'Básica', materias: primero },
    { clave: '1C-2026', anio: 1, div: 'C', ciclo: 2026, turno: 'Doble turno', orientacion: 'Básica', materias: primero },
    { clave: '2C-2026', anio: 2, div: 'C', ciclo: 2026, turno: 'Tarde', orientacion: 'Básica', materias: ['mat2', 'fra2'] },
    { clave: '4A-2026', anio: 4, div: 'A', ciclo: 2026, turno: 'Mañana', orientacion: 'Economía', materias: ['mat4eco', 'con4eco', 'eco4eco'] },
    { clave: '4B-2026', anio: 4, div: 'B', ciclo: 2026, turno: 'Tarde', orientacion: 'Economía', materias: ['mat4eco', 'con4eco', 'eco4eco'] },
    { clave: '4C-2026', anio: 4, div: 'C', ciclo: 2026, turno: 'Nocturno', orientacion: 'Educación', materias: ['mat4edu', 'ped4edu', 'psi4edu'] },
    { clave: '1A-2025', anio: 1, div: 'A', ciclo: 2025, turno: 'Doble turno', orientacion: 'Básica', materias: primero },
    { clave: '1B-2025', anio: 1, div: 'B', ciclo: 2025, turno: 'Doble turno', orientacion: 'Básica', materias: primero },
  ];
})();

/**
 * Grillas validadas en el Doble turno (pantalla Suplencias, A4): una fila por día y una
 * posición por hora cátedra (1ª a 10ª). Cada celda es la clave de la materia o null.
 * Los docentes de cada materia en el curso salen de DOCENTES_GRILLA.
 */
const _ = null;
export const GRILLAS: Record<string, (string | null)[][]> = {
  '1B': [
    ['fis1', 'fis1', 'mat1', 'mat1', 'len1', 'len1', 'inf1', _, _, _],
    ['qui1', 'len1', 'len1', 'his1', 'cat1', 'his1', 'inf1', _, _, _],
    ['art1', 'mat1', 'epa1', 'epa1', 'geo1', 'ing1', _, _, _, _],
    ['qui1', 'mat1', 'mat1', 'geo1', 'cat1', 'ing1', _, _, _, _],
    ['art1', 'his1', 'geo1', 'inf1', 'ing1', _, _, _, _, _],
  ],
  '1A': [
    [_, _, _, _, _, _, _, 'mat1', 'mat1', 'his1'],
    [_, _, _, _, _, _, _, 'len1', 'len1', _],
    [_, _, _, _, _, _, _, 'mat1', 'his1', 'his1'],
    [_, _, _, _, _, _, _, _, 'mat1', 'mat1'],
    [_, _, _, _, _, _, _, 'len1', _, _],
  ],
};

/** Docentes de cada materia de 1° año en las grillas (los mismos en todas sus franjas). */
export const DOCENTES_GRILLA: Record<string, string[]> = {
  mat1: ['jr'], len1: ['mp'], his1: ['rs'], geo1: ['ap'], inf1: ['aa'], ing1: ['ri'],
  fis1: ['ag'], qui1: ['jg'], cat1: ['hv'], art1: ['mb'], epa1: ['rs', 'ap'],
};

/** Propuestas (A12) y qué grillas tiene cada una: [curso, grilla]. */
export const PROPUESTAS: { codigo: string; nombre: string; ciclo: number; estado: string; creada: string; desc: string; grillas: [string, string][] }[] = [
  { codigo: 'PLAN-2025-01', nombre: 'Planificación 2025 (primera versión)', ciclo: 2025, estado: 'FVG', creada: '2025-03-20T10:00:00.000Z', desc: 'Reemplazada por PLAN-2025-02', grillas: [['1B-2025', '1B']] },
  { codigo: 'PLAN-2025-02', nombre: 'Planificación 2025', ciclo: 2025, estado: 'VIG', creada: '2025-12-15T10:00:00.000Z', desc: 'La vigente del ciclo 2025', grillas: [['1B-2025', '1B'], ['1A-2025', '1A']] },
  { codigo: 'PLAN-2026-01', nombre: 'Planificación 2026', ciclo: 2026, estado: 'VIG', creada: '2026-03-02T10:00:00.000Z', desc: 'Aprobada por Dirección, es la vigente', grillas: [['1B-2026', '1B'], ['1A-2026', '1A']] },
  { codigo: 'PLAN-2026-02', nombre: 'Planificación 2026 (ajustes)', ciclo: 2026, estado: 'BOR', creada: '2026-02-18T10:00:00.000Z', desc: 'Copia de PLAN-2026-01 para hacer ajustes', grillas: [['1B-2026', '1B']] },
];

/** Suplencias (datos-de-ejemplo.md, caso 1): Avellaneda cubre Matemática de 1° B. */
export const SUPLENCIAS = [
  { suplente: 'aa', desde: '2026-05-11', hasta: '2026-05-15', motivo: 'Licencia médica de Juan Ramírez', clases: [['PLAN-2026-01', '1B-2026', 'mat1']] },
];

/* ---------- Pago ---------- */

/** Pagos de Juan Ramírez (P4). firmado: fecha de la firma del profesor o null. */
export const PAGOS: { profesor: string; periodo: string; fecha_pago: string; firmado: string | null }[] = [
  { profesor: 'jr', periodo: '2026-03', fecha_pago: '2026-04-05', firmado: '2026-04-08T12:00:00.000Z' },
  { profesor: 'jr', periodo: '2026-04', fecha_pago: '2026-05-06', firmado: '2026-05-09T12:00:00.000Z' },
  { profesor: 'jr', periodo: '2026-05', fecha_pago: '2026-06-05', firmado: '2026-06-12T12:00:00.000Z' },
  { profesor: 'jr', periodo: '2026-06', fecha_pago: '2026-07-04', firmado: null },
  { profesor: 'jr', periodo: '2026-07', fecha_pago: '2026-08-05', firmado: null },
  { profesor: 'jr', periodo: '2026-08', fecha_pago: '2026-09-05', firmado: null },
];
