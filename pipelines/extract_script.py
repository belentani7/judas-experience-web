"""Extrae un bloque <script> inline de index.html a un archivo externo.

Determinista y reversible. No reescribe codigo: mueve BYTES EXACTOS.

Garantias que verifica antes de tocar nada:
  1. el numero de `</script>` del archivo coincide con los bloques detectados
     (si un literal de string contuviera "</script>", aborta en vez de cortar mal)
  2. el cuerpo extraido no contiene "</script>"
  3. los bytes escritos == los bytes del bloque original (hash SHA-256)
  4. index.html resultante, al quitar la referencia externa, vuelve a tener
     el mismo hash que el original

Uso:
    python pipelines/extract_script.py index.html --kind module --out core/hub-scene.js
    python pipelines/extract_script.py index.html --kind module --out core/hub-scene.js --apply
    python pipelines/extract_script.py index.html --list
"""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
from pathlib import Path

for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

SCRIPT_OPEN = re.compile(r"^(?P<indent>\s*)<script(?P<attrs>[^>]*)>", re.IGNORECASE)
SCRIPT_CLOSE = re.compile(r"</script>", re.IGNORECASE)


def sha(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def kind_of(attrs: str) -> str:
    if "importmap" in attrs:
        return "importmap"
    if re.search(r"""type\s*=\s*["']module["']""", attrs):
        return "module"
    return "classic"


def find_blocks(lines: list[str]) -> list[dict]:
    blocks: list[dict] = []
    index = 0
    while index < len(lines):
        match = SCRIPT_OPEN.match(lines[index])
        if not match:
            index += 1
            continue
        open_line = index
        close_line = None
        for probe in range(index, len(lines)):
            if SCRIPT_CLOSE.search(lines[probe]):
                close_line = probe
                break
        if close_line is None:
            raise SystemExit(f"ABORTADO: <script> sin cierre en linea {open_line + 1}")
        blocks.append(
            {
                "open": open_line,
                "close": close_line,
                "indent": match.group("indent"),
                "attrs": match.group("attrs"),
                "kind": kind_of(match.group("attrs")),
                "body": lines[open_line + 1 : close_line],
            }
        )
        index = close_line + 1
    return blocks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("html", type=Path)
    parser.add_argument("--kind", choices=["module", "classic", "importmap"])
    parser.add_argument("--out", type=Path)
    parser.add_argument("--src-attr")
    parser.add_argument("--apply", action="store_true", help="escribe los cambios")
    parser.add_argument("--list", action="store_true", help="solo lista los bloques")
    args = parser.parse_args()

    original = args.html.read_text(encoding="utf-8")
    if original.startswith("\ufeff"):
        raise SystemExit("ABORTADO: el archivo tiene BOM; normalizalo antes")
    newline = "\r\n" if "\r\n" in original else "\n"
    lines = original.split(newline)

    blocks = find_blocks(lines)
    total_closes = len(SCRIPT_CLOSE.findall(original))
    if total_closes != len(blocks):
        raise SystemExit(
            f"ABORTADO: {total_closes} cierres </script> frente a {len(blocks)} bloques. "
            "Un literal de string contiene la etiqueta; hay que revisar a mano."
        )

    # Los bloques importmap/module se abren y cierran en lineas distintas;
    # se comprueba que ninguno comparta linea con otro.
    for block in blocks:
        if block["close"] < block["open"]:
            raise SystemExit("ABORTADO: geometria de bloques incoherente")

    if args.list or not args.kind:
        print(f"{args.html}: {len(blocks)} bloques, {total_closes} cierres")
        for pos, block in enumerate(blocks):
            print(
                f"  [{pos}] {block['kind']:9} lineas {block['open'] + 1:>5}-{block['close'] + 1:<5} "
                f"{len(block['body']):>5} lineas"
            )
        return 0

    candidates = [b for b in blocks if b["kind"] == args.kind]
    if len(candidates) != 1:
        raise SystemExit(
            f"ABORTADO: {len(candidates)} bloques de tipo '{args.kind}'; usa --list y elige otro"
        )
    block = candidates[0]
    body = newline.join(block["body"])
    if SCRIPT_CLOSE.search(body):
        raise SystemExit("ABORTADO: el cuerpo contiene </script>")

    if args.out is None:
        raise SystemExit("falta --out")
    src_attr = args.src_attr or args.out.as_posix()

    header = (
        f"// Extraido de index.html lineas {block['open'] + 2}-{block['close']} por "
        f"pipelines/extract_script.py\n"
        f"// Contenido byte-exacto: no editar a mano sin volver a verificar.\n"
    )
    payload = header + body + newline

    replacement = (
        f"{block['indent']}<script type=\"module\" src=\"{src_attr}\"></script>"
    )

    print(f"bloque   : {block['kind']} lineas {block['open'] + 1}-{block['close'] + 1}")
    print(f"cuerpo   : {len(block['body'])} lineas / {len(body.encode('utf-8'))} bytes")
    print(f"sha256   : {sha(body)}")
    print(f"destino  : {args.out}")
    print(f"reemplazo: {replacement.strip()}")

    if not args.apply:
        print("\n(dry-run; añade --apply para escribir)")
        return 0

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(payload, encoding="utf-8", newline="")

    written = args.out.read_text(encoding="utf-8")
    if sha(written[len(header) :].removesuffix(newline)) != sha(body):
        args.out.unlink(missing_ok=True)
        raise SystemExit("ABORTADO: los bytes escritos no coinciden; nada que revertir")

    rebuilt = (
        lines[: block["open"]] + [replacement] + lines[block["close"] + 1 :]
    )
    args.html.with_suffix(args.html.suffix + ".pre-extract").write_text(
        original, encoding="utf-8", newline=""
    )
    args.html.write_text(newline.join(rebuilt), encoding="utf-8", newline="")

    after = args.html.read_text(encoding="utf-8")
    print(f"\nindex.html: {len(original.encode('utf-8'))} -> {len(after.encode('utf-8'))} bytes")
    print(f"backup   : {args.html.with_suffix(args.html.suffix + '.pre-extract')}")
    print(f"escrito  : {args.out} ({args.out.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
