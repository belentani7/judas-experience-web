"""Mapa estructural de index.html — F0 (modularizacion del hub).

Determinista, sin dependencias externas. Solo lee y reporta:
  - bloques <script> con rangos de linea, tipo y tamano
  - declaraciones top-level dentro de cada bloque
  - banners de seccion (// ---------- NOMBRE ----------)
  - estadisticas del cuerpo (palabras de texto visible, para dimensionar i18n)

Uso:
    python pipelines/analyze_hub.py index.html
    python pipelines/analyze_hub.py index.html --json
"""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

# La consola de Windows (cp1252) revienta con flechas y acentos: forzamos UTF-8
# con reemplazo para que el reporte nunca aborte a mitad.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

SCRIPT_OPEN = re.compile(r"^(\s*)<script(?P<attrs>[^>]*)>", re.IGNORECASE)
SCRIPT_CLOSE = re.compile(r"</script>", re.IGNORECASE)
DECL = re.compile(
    r"^(?:async\s+function|function|class|const|let|var)\s+([A-Za-z_$][\w$]*)"
)
BANNER = re.compile(r"^\s*//\s*-{3,}\s*(?P<name>[^-].*?)\s*-{3,}\s*$")
BLOCK_COMMENT = re.compile(r"^\s*/\*\s*=+\s*(?P<name>.+?)\s*=+\s*\*/\s*$")


class BodyText(HTMLParser):
    """Cuenta palabras de texto visible ignorando script/style."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.depth_skip = 0
        self.words = 0
        self.i18n_attrs = 0
        self.text_nodes = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in ("script", "style"):
            self.depth_skip += 1
        for name, _value in attrs:
            if name.startswith("data-i18n"):
                self.i18n_attrs += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style") and self.depth_skip:
            self.depth_skip -= 1

    def handle_data(self, data: str) -> None:
        if self.depth_skip:
            return
        stripped = data.strip()
        if not stripped:
            return
        self.text_nodes += 1
        self.words += len(stripped.split())


def script_blocks(lines: list[str]) -> list[dict]:
    blocks: list[dict] = []
    i = 0
    while i < len(lines):
        match = SCRIPT_OPEN.match(lines[i])
        if not match:
            i += 1
            continue
        start = i
        close = None
        for j in range(i, len(lines)):
            if SCRIPT_CLOSE.search(lines[j]):
                close = j
                break
        if close is None:
            close = len(lines) - 1
        attrs = match.group("attrs")
        kind = "classic"
        if "importmap" in attrs:
            kind = "importmap"
        elif 'type="module"' in attrs or "type='module'" in attrs:
            kind = "module"
        if "src=" in attrs:
            kind = "external"
        body = lines[start + 1 : close]
        blocks.append(
            {
                "kind": kind,
                "start": start + 1,
                "end": close + 1,
                "attrs": attrs.strip(),
                "body_lines": len(body),
                "body_bytes": sum(len(x) + 1 for x in body),
                "indent": len(match.group(1)),
            }
        )
        i = close + 1
    return blocks


def declarations(lines: list[str], start: int, end: int) -> list[dict]:
    found: list[dict] = []
    for index in range(start - 1, min(end, len(lines))):
        match = DECL.match(lines[index].strip())
        if match:
            found.append({"line": index + 1, "name": match.group(1)})
    return found


def markers(lines: list[str]) -> list[dict]:
    out: list[dict] = []
    for index, line in enumerate(lines):
        for pattern in (BANNER, BLOCK_COMMENT):
            match = pattern.match(line)
            if match:
                out.append({"line": index + 1, "name": match.group("name")})
                break
    return out


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    as_json = "--json" in sys.argv
    path = Path(args[0] if args else "index.html")
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    blocks = script_blocks(lines)
    for block in blocks:
        if block["kind"] in ("module", "classic"):
            block["declarations"] = declarations(lines, block["start"], block["end"])

    parser = BodyText()
    parser.feed(text)

    report = {
        "file": str(path),
        "bytes": path.stat().st_size,
        "lines": len(lines),
        "scripts": blocks,
        "markers": markers(lines),
        "body": {
            "visible_words": parser.words,
            "text_nodes": parser.text_nodes,
            "data_i18n_attrs": parser.i18n_attrs,
        },
    }

    if as_json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0

    print(f"{report['file']}")
    print(f"  {report['bytes']} bytes / {report['lines']} lineas")
    print(f"  cuerpo: {parser.words} palabras visibles en {parser.text_nodes} nodos de texto")
    print(f"  atributos data-i18n ya presentes: {parser.i18n_attrs}")
    print()
    print("BLOQUES <script>")
    for block in blocks:
        decls = block.get("declarations", [])
        print(
            f"  [{block['kind']:9}] lineas {block['start']:>5}-{block['end']:<5} "
            f"{block['body_lines']:>5} lineas / {block['body_bytes']:>7} bytes"
        )
        names = [d["name"] for d in decls]
        if names:
            preview = ", ".join(names[:12])
            more = "" if len(names) <= 12 else f"  (+{len(names) - 12} mas)"
            print(f"              top-level: {preview}{more}")
    print()
    print(f"BANNERS / SECCIONES ({len(report['markers'])})")
    for marker in report["markers"]:
        print(f"  {marker['line']:>5}  {marker['name']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
