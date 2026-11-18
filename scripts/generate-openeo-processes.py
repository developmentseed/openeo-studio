"""
Writes two files in app/algorithms/base/:

- openeo-processes.json: the process names that processes.py exposes as bare
  names. The linter and the Code tab panel read this list.
- openeo-process-docs.json: the documentation of each process, by its name in
  openeo.processes (op.<name>). The editor autocomplete and hover read it.

Run it with the openeo client version that Pyodide installs
(see app/stores/pyodide-store.ts):

    pip install "openeo<0.50"
    pnpm processes:generate
"""

import builtins
import inspect
import json
import re
from pathlib import Path

import openeo
import openeo.processes as op

BASE = Path(__file__).resolve().parent.parent / "app/algorithms/base"
OUTPUT = BASE / "openeo-processes.json"
DOCS_OUTPUT = BASE / "openeo-process-docs.json"

functions = {
    name: fn
    for name, fn in vars(op).items()
    if inspect.isfunction(fn) and fn.__module__ == op.__name__ and not name.startswith("_")
}

# Same rule as app/algorithms/base/processes.py.
names = sorted(f"{name}_" if hasattr(builtins, name) else name for name in functions)


def parse_docstring(fn) -> dict:
    """
    Reads the client docstring: a summary line, then ":param <name>: <text>"
    and ":return: <text>" fields with indented continuation lines.
    """
    doc = inspect.getdoc(fn) or ""
    doc = doc.split(".. seealso::")[0]
    summary, _, fields = doc.partition("\n\n")
    params = {}
    returns = ""
    for field in re.split(r"\n(?=:)", fields.strip()):
        text = " ".join(field.split())
        if match := re.match(r":param (\w+): (.*)", text):
            params[match[1]] = match[2]
        elif text.startswith(":return:"):
            returns = text.removeprefix(":return:").strip()
    signature = inspect.signature(fn).parameters.values()
    return {
        "summary": " ".join(summary.split()),
        "params": [
            {
                "name": param.name,
                "optional": param.default is not inspect.Parameter.empty,
                "description": params.get(param.name, ""),
            }
            for param in signature
        ],
        "returns": returns,
    }


docs = {name: parse_docstring(functions[name]) for name in sorted(functions)}

# A docstring format change in a new client version shows up as missing docs.
undocumented = [f"{name}({p['name']})" for name, d in docs.items() for p in d["params"] if not p["description"]]
if undocumented:
    print(f"Warning: {len(undocumented)} parameters have no description: {', '.join(undocumented)}")

DOCS_OUTPUT.write_text(
    json.dumps(
        {"openeoVersion": openeo.__version__, "processes": docs},
        indent=2,
    )
    + "\n"
)

OUTPUT.write_text(
    json.dumps({"openeoVersion": openeo.__version__, "processes": names}, indent=2) + "\n"
)
print(f"Wrote {len(names)} process names (openeo {openeo.__version__}) to {OUTPUT}")
print(f"Wrote {len(functions)} process docs to {DOCS_OUTPUT}")
