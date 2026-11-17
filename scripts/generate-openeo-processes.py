"""
Writes app/algorithms/base/openeo-processes.json: the process names that
app/algorithms/base/processes.py exposes as bare names. The linter and the
Code tab panel read this list.

Run it with the openeo client version that Pyodide installs
(see app/stores/pyodide-store.ts):

    pip install "openeo<0.50"
    pnpm processes:generate
"""

import builtins
import inspect
import json
from pathlib import Path

import openeo
import openeo.processes as op

OUTPUT = Path(__file__).resolve().parent.parent / "app/algorithms/base/openeo-processes.json"

# Same rule as app/algorithms/base/processes.py.
names = sorted(
    f"{name}_" if hasattr(builtins, name) else name
    for name, fn in vars(op).items()
    if inspect.isfunction(fn) and fn.__module__ == op.__name__ and not name.startswith("_")
)

OUTPUT.write_text(
    json.dumps({"openeoVersion": openeo.__version__, "processes": names}, indent=2) + "\n"
)
print(f"Wrote {len(names)} process names (openeo {openeo.__version__}) to {OUTPUT}")
