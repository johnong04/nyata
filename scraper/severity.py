"""Neutral display band from the notice's OWN action words (specs §6/§11.2 LC4).
Not a self-authored judgment: a market recall/withdrawal/cancellation/ban =>
'elak' (mapped to 'high' on render); a precautionary replacement/advisory =>
'waspada'. Default 'elak' — an official recall is already a strong, cautious
signal, and failing safe never invents a softer band than the source implies.

Caller passes the field that carries the action language for that source:
  - KPDN: the "Notice of Recall" reason cell (titles are just product names).
  - NPRA: the article title (it states the safety signal).
Both are the AUTHORITY'S own words — never Nyata-authored text.
"""
import re

# recall-family first: a hard market action outranks a softer advisory word if
# both appear (e.g. "recall and replacement" -> elak).
_RECALL = re.compile(r"\b(recall|withdraw|cancellation|cancel|prohibit|ban)\w*",
                     re.IGNORECASE)
_ADVISORY = re.compile(r"\b(replace|replacement|advisor|caution|precaution|preemptive)\w*",
                       re.IGNORECASE)


def severity(text: str) -> str:
    t = text or ""
    if _RECALL.search(t):
        return "elak"
    if _ADVISORY.search(t):
        return "waspada"
    return "elak"
