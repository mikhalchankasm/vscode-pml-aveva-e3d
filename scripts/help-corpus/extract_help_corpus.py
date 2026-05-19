#!/usr/bin/env python3
"""Extract a reusable help corpus from a large AVEVA PDF manual.

The extension must not read the PDF at runtime. This script creates a local,
ignored development corpus that agents can inspect when selecting focused
implementation slices.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

try:
    import fitz  # PyMuPDF
except ImportError as exc:
    raise SystemExit(
        "Missing Python package 'fitz' (PyMuPDF). Install it in the local "
        "tooling environment before extracting the help corpus."
    ) from exc


DEFAULT_FOCUS_RE = (
    r"Programmable Macro Language|PML\b|PML2\b|DBRef|ElementType|"
    r"dot Notation in PML|Database Navigation and Query Syntax|"
    r"Using Commands|Common Commands|Command Description Format|"
    r"Syntax Diagrams|SPECONMODE Command Syntax|PROPCON Command Syntax"
)

SYNTAX_KEYWORD_RE = re.compile(r"\b[A-Z]{2,}[A-Za-z0-9]*\b")


@dataclass(frozen=True)
class TocEntry:
    index: int
    level: int
    title: str
    page: int
    title_path: tuple[str, ...]


@dataclass(frozen=True)
class Section:
    id: str
    level: int
    title: str
    title_path: tuple[str, ...]
    start_page: int
    end_page: int
    is_focus: bool


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def json_default(value: object) -> object:
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, tuple):
        return list(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=True, default=json_default) + "\n",
        encoding="utf-8",
    )


def write_jsonl(path: Path, values: Iterable[object]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for value in values:
            handle.write(json.dumps(value, ensure_ascii=True, default=json_default))
            handle.write("\n")
            count += 1
    return count


def slugify(value: str, fallback: str) -> str:
    value = value.lower()
    value = value.replace("pml2", "pml2").replace("pml", "pml")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")
    return value[:80] or fallback


def build_toc(raw_toc: list[list[object]]) -> list[TocEntry]:
    stack: list[str] = []
    entries: list[TocEntry] = []

    for index, raw in enumerate(raw_toc):
        level = int(raw[0])
        title = str(raw[1]).replace("\ufffd", "'").strip()
        page = int(raw[2])

        if level <= 0:
            level = 1
        stack = stack[: level - 1]
        stack.append(title)

        entries.append(
            TocEntry(
                index=index,
                level=level,
                title=title,
                page=page,
                title_path=tuple(stack),
            )
        )

    return entries


def build_sections(entries: list[TocEntry], page_count: int, focus_re: re.Pattern[str]) -> list[Section]:
    sections: list[Section] = []

    for current in entries:
        end_page = page_count
        for candidate in entries[current.index + 1 :]:
            if candidate.level <= current.level:
                end_page = max(current.page, candidate.page - 1)
                break

        source = " / ".join(current.title_path)
        section_id = f"{current.page:05d}-{slugify(source, f'section-{current.index + 1}')}"
        sections.append(
            Section(
                id=section_id,
                level=current.level,
                title=current.title,
                title_path=current.title_path,
                start_page=current.page,
                end_page=end_page,
                is_focus=bool(focus_re.search(source)),
            )
        )

    return sections


def section_to_record(section: Section) -> dict[str, object]:
    return {
        "id": section.id,
        "level": section.level,
        "title": section.title,
        "titlePath": section.title_path,
        "startPage": section.start_page,
        "endPage": section.end_page,
        "pageCount": section.end_page - section.start_page + 1,
        "isFocus": section.is_focus,
    }


def is_descendant(child: Section, parent: Section) -> bool:
    return (
        len(child.title_path) > len(parent.title_path)
        and child.title_path[: len(parent.title_path)] == parent.title_path
    )


def select_sections_for_chunks(sections: list[Section], mode: str) -> list[Section]:
    if mode == "all":
        return sections
    if mode == "index":
        return []

    focused = [section for section in sections if section.is_focus]
    focused_ids_with_children = {
        parent.id
        for parent in focused
        for child in focused
        if is_descendant(child, parent)
    }

    return [section for section in focused if section.id not in focused_ids_with_children]


def toc_to_record(entry: TocEntry) -> dict[str, object]:
    return {
        "index": entry.index,
        "level": entry.level,
        "title": entry.title,
        "titlePath": entry.title_path,
        "page": entry.page,
    }


def normalize_page_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\ufffd", "'")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text.strip()


def iter_section_chunks(
    document: "fitz.Document",
    sections: Iterable[Section],
    max_chunk_chars: int,
) -> Iterable[dict[str, object]]:
    for section in sections:
        buffer: list[str] = []
        chunk_start_page = section.start_page
        chunk_index = 1

        for page_number in range(section.start_page, section.end_page + 1):
            page = document.load_page(page_number - 1)
            text = normalize_page_text(page.get_text("text"))
            if not text:
                continue

            page_text = f"\n\n[page {page_number}]\n{text}"
            current_size = sum(len(part) for part in buffer)
            if buffer and current_size + len(page_text) > max_chunk_chars:
                yield {
                    "id": f"{section.id}-chunk-{chunk_index:03d}",
                    "sectionId": section.id,
                    "chunkIndex": chunk_index,
                    "titlePath": section.title_path,
                    "startPage": chunk_start_page,
                    "endPage": page_number - 1,
                    "text": "".join(buffer).strip(),
                }
                buffer = []
                chunk_start_page = page_number
                chunk_index += 1

            buffer.append(page_text)

        if buffer:
            yield {
                "id": f"{section.id}-chunk-{chunk_index:03d}",
                "sectionId": section.id,
                "chunkIndex": chunk_index,
                "titlePath": section.title_path,
                "startPage": chunk_start_page,
                "endPage": section.end_page,
                "text": "".join(buffer).strip(),
            }


def iter_code_line_candidates(chunks_path: Path) -> Iterable[dict[str, object]]:
    codeish = re.compile(
        r"(^|\s)(!!?[A-Za-z][A-Za-z0-9_]*|[A-Z][A-Z0-9_]{2,}|"
        r"\$[A-Za-z]|\.?[A-Za-z][A-Za-z0-9_]*\s*\()"
    )
    noise = re.compile(r"^(page|copyright|figure|table)\b", re.IGNORECASE)

    with chunks_path.open("r", encoding="utf-8") as handle:
        for raw in handle:
            chunk = json.loads(raw)
            for line_number, line in enumerate(str(chunk["text"]).splitlines(), start=1):
                stripped = " ".join(line.split())
                if len(stripped) < 4 or len(stripped) > 240:
                    continue
                if noise.search(stripped):
                    continue
                if codeish.search(stripped):
                    yield {
                        "chunkId": chunk["id"],
                        "sectionId": chunk["sectionId"],
                        "pageRange": [chunk["startPage"], chunk["endPage"]],
                        "line": line_number,
                        "text": stripped,
                    }


def parse_syntax_keyword_token(token: str) -> dict[str, object] | None:
    """Parse AVEVA syntax-diagram keyword casing.

    Syntax diagrams use uppercase letters as the minimum command abbreviation:
    DEFault may be entered as DEF, DEFA, DEFAU, DEFAUL, or DEFAULT. Fully
    uppercase keywords cannot be abbreviated.
    """
    match = re.match(r"^([A-Z]{2,}[A-Z0-9]*)([a-z][A-Za-z0-9]*)?$", token)
    if not match:
        return None

    minimum = match.group(1).upper()
    full = token.upper()
    return {
        "token": token,
        "keyword": full,
        "minimum": minimum,
        "canAbbreviate": minimum != full,
    }


def iter_syntax_keyword_candidates(chunks_path: Path) -> Iterable[dict[str, object]]:
    seen: set[tuple[str, str, str]] = set()

    with chunks_path.open("r", encoding="utf-8") as handle:
        for raw in handle:
            chunk = json.loads(raw)
            for line_number, line in enumerate(str(chunk["text"]).splitlines(), start=1):
                has_syntax_marker = "---" in line or ">---" in line or "|---" in line
                for token in SYNTAX_KEYWORD_RE.findall(line):
                    parsed = parse_syntax_keyword_token(token)
                    if not parsed:
                        continue
                    if not parsed["canAbbreviate"] and not has_syntax_marker:
                        continue

                    key = (str(chunk["sectionId"]), str(parsed["keyword"]), str(parsed["minimum"]))
                    if key in seen:
                        continue
                    seen.add(key)

                    yield {
                        "chunkId": chunk["id"],
                        "sectionId": chunk["sectionId"],
                        "pageRange": [chunk["startPage"], chunk["endPage"]],
                        "line": line_number,
                        **parsed,
                    }


def resolve_output_dir(pdf_path: Path, output_dir: str | None) -> Path:
    if output_dir:
        return Path(output_dir)
    return pdf_path.parent / ".derived" / pdf_path.stem


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path, help="Path to the source PDF manual.")
    parser.add_argument(
        "--output-dir",
        help="Output directory. Defaults to manuals/.derived/<pdf-stem>.",
    )
    parser.add_argument(
        "--mode",
        choices=["index", "focus", "all"],
        default="focus",
        help="index writes metadata only, focus writes focused chunks, all writes every section chunk.",
    )
    parser.add_argument(
        "--focus-regex",
        default=DEFAULT_FOCUS_RE,
        help=(
            "Case-insensitive section-title regex for focus extraction. The "
            "default is intentionally narrow; pass a custom regex for deep "
            "attribute or product-area extraction."
        ),
    )
    parser.add_argument(
        "--max-chunk-chars",
        type=int,
        default=12000,
        help="Approximate maximum text characters per JSONL chunk.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    pdf_path = args.pdf.resolve()
    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}", file=sys.stderr)
        return 2

    output_dir = resolve_output_dir(pdf_path, args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    focus_re = re.compile(args.focus_regex, re.IGNORECASE)

    pdf_hash = sha256_file(pdf_path)
    document = fitz.open(str(pdf_path))
    toc = build_toc(document.get_toc(simple=True))
    sections = build_sections(toc, document.page_count, focus_re)

    selected_sections = select_sections_for_chunks(sections, args.mode)
    selected_section_count = len(selected_sections)

    manifest = {
        "schemaVersion": 1,
        "source": {
            "path": str(pdf_path),
            "name": pdf_path.name,
            "sizeBytes": pdf_path.stat().st_size,
            "sha256": pdf_hash,
            "lastModifiedUtc": datetime.fromtimestamp(
                pdf_path.stat().st_mtime,
                tz=timezone.utc,
            ).isoformat(),
        },
        "pdf": {
            "pageCount": document.page_count,
            "metadata": document.metadata,
            "tocItemCount": len(toc),
        },
        "extraction": {
            "createdUtc": datetime.now(timezone.utc).isoformat(),
            "mode": args.mode,
            "focusRegex": args.focus_regex,
            "selectedSectionCount": selected_section_count,
            "maxChunkChars": args.max_chunk_chars,
            "tool": "scripts/help-corpus/extract_help_corpus.py",
        },
        "outputs": {
            "toc": "toc.jsonl",
            "sections": "sections.jsonl",
            "chunks": "chunks.jsonl" if args.mode != "index" else None,
            "codeLineCandidates": "candidates/code-lines.jsonl" if args.mode != "index" else None,
            "syntaxKeywordCandidates": "candidates/syntax-keywords.jsonl" if args.mode != "index" else None,
        },
    }

    write_json(output_dir / "manifest.json", manifest)
    toc_count = write_jsonl(output_dir / "toc.jsonl", (toc_to_record(entry) for entry in toc))
    section_count = write_jsonl(
        output_dir / "sections.jsonl",
        (section_to_record(section) for section in sections),
    )

    chunk_count = 0
    candidate_count = 0
    if args.mode != "index":
        chunks_path = output_dir / "chunks.jsonl"
        chunk_count = write_jsonl(
            chunks_path,
            iter_section_chunks(document, selected_sections, args.max_chunk_chars),
        )
        candidate_count = write_jsonl(
            output_dir / "candidates" / "code-lines.jsonl",
            iter_code_line_candidates(chunks_path),
        )
        syntax_keyword_count = write_jsonl(
            output_dir / "candidates" / "syntax-keywords.jsonl",
            iter_syntax_keyword_candidates(chunks_path),
        )

    print(f"Output: {output_dir}")
    print(f"PDF pages: {document.page_count}")
    print(f"TOC items: {toc_count}")
    print(f"Sections: {section_count}")
    print(f"Selected sections: {selected_section_count}")
    if args.mode != "index":
        print(f"Chunks: {chunk_count}")
        print(f"Code-line candidates: {candidate_count}")
        print(f"Syntax keyword candidates: {syntax_keyword_count}")

    document.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
