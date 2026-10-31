#!/usr/bin/env python3
"""Build the deployable site into _site/.

Copies the tracked site files and fills the {{LEGAL_*}} placeholders from
the environment (LEGAL_STREET, LEGAL_CITY, LEGAL_EMAIL, LEGAL_VAT). In CI
the values come from repository secrets. For a local preview, if a variable
is missing it is read from private/legal.json (gitignored).

Never prints the values. Fails if a value is missing or a placeholder is left.
"""
import html
import json
import os
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"
EXCLUDE_PREFIXES = (".github/", "scripts/")
EXCLUDE_FILES = {".gitignore", "README.md"}
FIELDS = ("street", "city", "email", "vat")


def load_values():
    values = {f: os.environ.get("LEGAL_" + f.upper(), "") for f in FIELDS}
    missing = [f for f, v in values.items() if not v]
    local = ROOT / "private" / "legal.json"
    if missing and local.exists():
        data = json.loads(local.read_text(encoding="utf-8"))
        for f in missing:
            values[f] = data.get(f, "")
    missing = [f for f, v in values.items() if not v]
    if missing:
        sys.exit("missing legal values: " + ", ".join("LEGAL_" + f.upper() for f in missing))
    user, sep, domain = values["email"].partition("@")
    if not sep or not user or not domain:
        sys.exit("LEGAL_EMAIL is not an e-mail address")
    placeholders = {"LEGAL_" + f.upper(): v for f, v in values.items()}
    placeholders["LEGAL_EMAIL_USER"] = user
    placeholders["LEGAL_EMAIL_DOMAIN"] = domain
    return {"{{" + k + "}}": html.escape(v, quote=True) for k, v in placeholders.items()}


def tracked_files():
    out = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, check=True, capture_output=True).stdout
    for name in out.decode().split("\0"):
        if name and not name.startswith(EXCLUDE_PREFIXES) and name not in EXCLUDE_FILES:
            yield name


def main():
    replacements = load_values()
    if OUT.exists():
        shutil.rmtree(OUT)
    count = 0
    for name in tracked_files():
        src, dst = ROOT / name, OUT / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        if name.endswith(".html"):
            text = src.read_text(encoding="utf-8")
            for key, value in replacements.items():
                text = text.replace(key, value)
            if "{{LEGAL_" in text:
                sys.exit("unfilled placeholder in " + name)
            dst.write_text(text, encoding="utf-8")
        else:
            shutil.copy2(src, dst)
        count += 1
    print(f"built {count} files into _site/")


if __name__ == "__main__":
    main()
