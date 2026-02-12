#!/usr/bin/env python3
"""
Regenerate books.json from the Obsidian vault.
Reads all .md files in Books I Have Read, extracts YAML frontmatter,
writes dist/books.json.
"""
import json
import yaml
from pathlib import Path
from datetime import date

VAULT_DIR = Path("/home/clawdbot/obsidian/Default Vault/Bases/_base_data/Books I Have Read")
OUT_FILE  = Path("/home/clawdbot/clawd/books-viz-app/dist/books.json")

def extract_frontmatter(content: str) -> dict:
    if not content.startswith('---'):
        return {}
    lines = content.split('\n')
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == '---'), None)
    if end is None:
        return {}
    try:
        return yaml.safe_load('\n'.join(lines[1:end])) or {}
    except:
        return {}

def serialize(val):
    """Make values JSON-serializable."""
    if isinstance(val, date):
        return val.isoformat()
    if isinstance(val, dict):
        return {k: serialize(v) for k, v in val.items()}
    if isinstance(val, list):
        return [serialize(v) for v in val]
    return val

def generate():
    books = []
    for f in sorted(VAULT_DIR.glob("*.md")):
        if f.name == "Content.md":
            continue
        try:
            data = extract_frontmatter(f.read_text(encoding='utf-8'))
            if not data:
                continue
            data['_filename'] = f.stem
            books.append({k: serialize(v) for k, v in data.items()})
        except Exception as e:
            print(f"  ⚠️  {f.name}: {e}")

    OUT_FILE.write_text(json.dumps(books, ensure_ascii=False, indent=2))
    print(f"✅ Generated books.json — {len(books)} books → {OUT_FILE}")

if __name__ == "__main__":
    generate()
