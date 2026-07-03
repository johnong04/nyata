"""Python port of lib/recalls/normalize.ts. MUST stay byte-identical in output to
the TS version — both sides key on the same normalized strings (seed/scrape time
here; query time in TS). Any divergence silently breaks recall matching.

TS pipeline (mirrored exactly): NFKD -> strip combining marks U+0300-U+036F ->
lowercase -> [^a-z0-9]+ -> single space -> trim -> collapse whitespace.
"""
import re
import unicodedata

_COMBINING = re.compile(r"[̀-ͯ]")
_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_WS = re.compile(r"\s+")


def normalize(s: str | None) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = _COMBINING.sub("", s)
    s = s.lower()
    s = _NON_ALNUM.sub(" ", s)
    s = s.strip()
    s = _WS.sub(" ", s)
    return s


def normalize_barcode(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"\D+", "", s)
