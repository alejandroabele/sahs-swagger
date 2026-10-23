import type { CSSProperties } from 'react';

const cache = new Map<string, CSSProperties>();

/**
 * Convierte un estilo en texto (como en el prototipo: "display: flex; gap: 8px;") en un
 * objeto de estilos de React. Así las pantallas copian los estilos del diseño tal cual.
 *   <div style={css('display: flex; gap: 8px;')} />
 */
export function css(texto: string | null | undefined | false): CSSProperties {
  if (!texto) return {};
  const enCache = cache.get(texto);
  if (enCache) return enCache;
  const out: Record<string, string> = {};
  for (const decl of splitDeclaraciones(texto)) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const valor = decl.slice(i + 1).trim();
    if (!prop || !valor) continue;
    const clave = prop.startsWith('--') ? prop : prop.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[clave] = valor;
  }
  if (cache.size > 5000) cache.clear();
  cache.set(texto, out as CSSProperties);
  return out as CSSProperties;
}

/** Separa por ';' sin cortar dentro de paréntesis (url(), rgba(), etc.). */
function splitDeclaraciones(s: string): string[] {
  const out: string[] = [];
  let nivel = 0;
  let actual = '';
  for (const ch of s) {
    if (ch === '(') nivel++;
    if (ch === ')') nivel--;
    if (ch === ';' && nivel === 0) {
      out.push(actual);
      actual = '';
    } else actual += ch;
  }
  if (actual.trim()) out.push(actual);
  return out;
}

/** Une estilos en texto (los vacíos se ignoran) y devuelve el objeto. */
export const cssDe = (...partes: (string | null | undefined | false)[]) => css(partes.filter(Boolean).join(' '));
