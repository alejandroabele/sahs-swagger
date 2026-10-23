"""Exporta el prototipo navegable a partir de las pantallas del diseño (*.dc.html).

Uso (desde swagger/):
    python3 tools/exportar_prototipo.py <carpeta_diseno> [--check]

<carpeta_diseno> es la carpeta con los .dc.html (por ejemplo ../ o una copia
extraída del artifact). Reescribe prototipo/index.html, que es toda la aplicación:
el Login y todas las pantallas. Con --check no escribe nada: solo informa si el
archivo cambiaría.

El HTML tiene dos tipos de partes:
- Hechas a mano y que el script no toca: el armazón (solo el contenedor que
  escala la pantalla y la navegación: sesión, privilegios y hash), el runtime
  que reemplaza a support.js y CONFIG (qué pantallas hay, a qué privilegio
  pertenece cada una, qué pantalla abre cada tarjeta del inicio y los atajos
  entre pantallas).
- Generadas desde los .dc.html, que se reemplazan en cada exportación:
  1. los estilos de las pantallas (los <style> de cada <helmet>, sin líneas
     repetidas y con `body` cambiado por `.dc-root`);
  2. un <template id="tpl-<id>"> por pantalla (el cuerpo de <x-dc> sin <helmet>);
  3. la lógica de cada pantalla (el <script data-dc-script> envuelto en
     DC.registrar).

Las pantallas que se exportan son las que figuran en CONFIG.pantallas. El id de la pantalla es el nombre del .dc.html en minúsculas.
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SALIDAS = [RAIZ / "prototipo" / "index.html"]

MARCA_ESTILOS = "/* ===== estilos originales de las pantallas ===== */"
MARCA_TPL = "<!-- ===================== plantillas de las pantallas ===================== -->"
MARCA_LOGICA = "<!-- ===================== lógica de cada pantalla ===================== -->"


def leer_config(html):
    m = re.search(r"var CONFIG = (\{.*?\n\});", html, re.S)
    if not m:
        sys.exit("No encontré CONFIG en el HTML")
    return json.loads(m.group(1))


def archivos_por_id(carpeta):
    return {p.name[: -len(".dc.html")].lower(): p for p in carpeta.glob("*.dc.html")}


def partes(dc):
    src = dc.read_text(encoding="utf-8")
    cuerpo = re.search(r"<x-dc>(.*?)</x-dc>", src, re.S).group(1)
    helmet = re.search(r"<helmet>(.*?)</helmet>", cuerpo, re.S)
    estilos = re.findall(r"<style>(.*?)</style>", helmet.group(1), re.S) if helmet else []
    plantilla = re.sub(r"<helmet>.*?</helmet>", "", cuerpo, flags=re.S).strip("\n")
    script = re.search(r"<script data-dc-script[^>]*>(.*?)</script>", src, re.S).group(1)
    return estilos, plantilla, script


def exportar(html, carpeta):
    config = leer_config(html)
    dcs = archivos_por_id(carpeta)
    lineas_estilo, vistas, plantillas, logicas = [], set(), [], []
    for cod, p in config["pantallas"].items():
        dc = dcs.get(p["id"])
        if not dc:
            sys.exit(f"{cod}: no existe {p['id']}.dc.html en {carpeta}")
        estilos, plantilla, script = partes(dc)
        for bloque in estilos:
            for linea in bloque.strip("\n").split("\n"):
                if linea.strip() and linea not in vistas:
                    vistas.add(linea)
                    lineas_estilo.append(linea)
        plantillas.append(f'<template id="tpl-{p["id"]}">\n{plantilla}\n</template>\n')
        logicas.append(f"<script>\n/* {cod} · {p['titulo']} — lógica original de {dc.name} */\n"
                       f'DC.registrar("{p["id"]}", {{ Component: (function (DCLogic) {{'
                       f"{script.rstrip()}\nreturn Component;\n}})(window.DCLogic) }});\n</script>\n")
    # la regla de body pasa a .dc-root (el contenedor de cada pantalla)
    lineas_estilo = ["  " + l.strip().replace("body {", ".dc-root {", 1) if l.strip().startswith("body {") else l
                     for l in lineas_estilo]
    estilos = "\n".join(lineas_estilo)
    return estilos, "\n".join(plantillas), "\n".join(logicas)


def reemplazar(html, estilos, plantillas, logicas):
    # 1. estilos: desde la marca hasta el cierre de su <style>
    i = html.index(MARCA_ESTILOS) + len(MARCA_ESTILOS)
    j = html.index("</style>", i)
    html = html[:i] + "\n" + estilos + "\n" + html[j:]
    # 2. plantillas: desde su marca hasta el primer <script> (el runtime)
    i = html.index(MARCA_TPL) + len(MARCA_TPL)
    j = html.index("<script>", i)
    html = html[:i] + "\n" + plantillas + "\n" + html[j:]
    # 3. lógica: desde su marca hasta el <script> de CONFIG
    i = html.index(MARCA_LOGICA) + len(MARCA_LOGICA)
    j = html.index("<script>\nvar CONFIG", i)
    html = html[:i] + "\n" + logicas + "\n" + html[j:]
    return html


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    carpeta = Path(sys.argv[1])
    check = "--check" in sys.argv
    cambios = 0
    for salida in SALIDAS:
        actual = salida.read_text(encoding="utf-8")
        nuevo = reemplazar(actual, *exportar(actual, carpeta))
        if nuevo != actual:
            cambios += 1
            print(f"{'cambiaría' if check else 'actualizado'}: {salida.relative_to(RAIZ)}")
            if not check:
                salida.write_text(nuevo, encoding="utf-8")
        else:
            print(f"sin cambios: {salida.relative_to(RAIZ)}")
    if check and cambios:
        sys.exit(1)


if __name__ == "__main__":
    main()
