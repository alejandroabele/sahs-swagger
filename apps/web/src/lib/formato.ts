/** Utilidades de formato compartidas por las pantallas. */

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

/** $ 116.424 */
export function pesos(n: number): string {
  return '$ ' + Math.round(n).toLocaleString('es-AR');
}

/** 2026-05-11 → 11/05/2026 */
export function fecha(iso: string | null | undefined): string {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** 2026-08 → Agosto 2026 */
export function nombrePeriodo(p: string): string {
  return `${MESES[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;
}

/** Iniciales para los avatares: "Juan Ramírez" → "JR". */
export function iniciales(nombre: string, apellido?: string): string {
  if (apellido !== undefined) return ((nombre[0] ?? '') + (apellido[0] ?? '')).toUpperCase();
  const p = nombre.replace('Hno. ', '').split(' ');
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

/** Fecha de hoy YYYY-MM-DD (hora local). */
export function hoy(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Descarga un Blob como archivo. */
export function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
