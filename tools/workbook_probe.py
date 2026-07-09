import argparse
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def text_of(node):
    return "".join(node.itertext()) if node is not None else ""


def shared_strings(zf):
    try:
        root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [text_of(si) for si in root.findall("a:si", NS)]


def sheets(zf):
    book = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    targets = {
        r.attrib["Id"]: "xl/" + r.attrib["Target"].lstrip("/")
        for r in rels.findall("rel:Relationship", NS)
    }
    for s in book.findall("a:sheets/a:sheet", NS):
        yield {
            "name": s.attrib["name"],
            "state": s.attrib.get("state", "visible"),
            "path": targets[s.attrib["{%s}id" % NS["r"]]],
        }


def cell_text(cell, strings):
    formula = text_of(cell.find("a:f", NS))
    value = text_of(cell.find("a:v", NS))
    if cell.attrib.get("t") == "s" and value.isdigit():
        value = strings[int(value)]
    return " ".join(x for x in (formula, value) if x)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    ap = argparse.ArgumentParser(description="Fast XLSX formula/text probe.")
    ap.add_argument("xlsx", type=Path)
    ap.add_argument("--sheet", action="append", default=[], help="case-insensitive sheet-name substring")
    ap.add_argument("--hidden", action="store_true", help="only scan hidden sheets")
    ap.add_argument("--term", action="append", default=[], help="case-insensitive text/formula substring")
    ap.add_argument("--max", type=int, default=80)
    args = ap.parse_args()

    terms = [t.lower() for t in args.term]
    sheet_filters = [s.lower() for s in args.sheet]

    with zipfile.ZipFile(args.xlsx) as zf:
        strings = shared_strings(zf)
        for sheet in sheets(zf):
            if args.hidden and sheet["state"] != "hidden":
                continue
            if sheet_filters and not any(s in sheet["name"].lower() for s in sheet_filters):
                continue
            print(f'\n[{sheet["state"]}] {sheet["name"]}')
            root = ET.fromstring(zf.read(sheet["path"]))
            hits = 0
            for cell in root.findall(".//a:c", NS):
                text = cell_text(cell, strings)
                if not text:
                    continue
                if terms and not any(t in text.lower() for t in terms):
                    continue
                print(cell.attrib.get("r", "?"), re.sub(r"\s+", " ", text)[:220])
                hits += 1
                if hits >= args.max:
                    break


if __name__ == "__main__":
    main()
