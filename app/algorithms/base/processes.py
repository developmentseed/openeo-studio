"""
openEO process functions for the user code.

openEO Studio runs this file before loader.py, so the processes stay available
even when a deployment replaces loader.py.

Recommended style: op.<name>, for example op.clip(x, 0, 1) or op.max(data).
Python keywords keep the trailing underscore of the client: op.if_, op.and_.

For compatibility, every process function is also available as a bare name.
A name that clashes with a Python built-in gets a trailing underscore
(max -> max_), because Python's max(), round() or int() do not work on
openEO graph objects.
"""

import builtins as _builtins
import inspect as _inspect

import openeo.processes as op
from openeo.processes import process

for _name, _fn in vars(op).items():
    if (
        _inspect.isfunction(_fn)
        and _fn.__module__ == op.__name__
        and not _name.startswith("_")
    ):
        globals()[f"{_name}_" if hasattr(_builtins, _name) else _name] = _fn

del _name, _fn
