import { Diagnostic, linter } from '@codemirror/lint';
import ruffInit, {
  Workspace,
  type Diagnostic as RuffDiagnostic,
  PositionEncoding
} from '@astral-sh/ruff-wasm-web';

import {
  LOADER_GLOBALS,
  OPENEO_PROCESS_NAMES
} from '../algorithms/base/environment';

let ruffWorkspace: Workspace | null = null;
let initPromise: Promise<void> | null = null;

async function initRuff() {
  if (ruffWorkspace) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await ruffInit();
    ruffWorkspace = new Workspace(
      {
        // The names that code-runner.ts, processes.py and loader.py define
        // before the user code runs.
        builtins: [...LOADER_GLOBALS, ...OPENEO_PROCESS_NAMES],
        'target-version': 'py310',
        'line-length': 88,
        'indent-width': 4,
        lint: {
          'allowed-confusables': [],
          'dummy-variable-rgx': '^(_+|(_+[a-zA-Z0-9_]*[a-zA-Z0-9]+?))$',
          'extend-select': [],
          'extend-fixable': [],
          external: [],
          select: ['F', 'E4', 'E7', 'E9']
        },
        format: {
          'indent-style': 'space',
          'quote-style': 'double'
        }
      },
      PositionEncoding.Utf16
    );
  })();

  return initPromise;
}

/**
 * Formats Python code with Ruff. Returns the code as it is when Ruff can't
 * load or can't parse it.
 */
export async function formatPython(code: string): Promise<string> {
  try {
    await initRuff();
    return ruffWorkspace!.format(code);
  } catch {
    return code;
  }
}

export function ruffLinter(options?: { ignoreCodes?: string[] }) {
  // Initialize Ruff asynchronously
  initRuff();

  const ignoreCodes = options?.ignoreCodes || [];

  return linter((view) => {
    // Return empty diagnostics if Ruff is not yet initialized
    if (!ruffWorkspace) return [];

    const doc = view.state.doc;
    const res: RuffDiagnostic[] = ruffWorkspace.check(doc.toString());

    return res
      .filter((d) => !d.code || !ignoreCodes.includes(d.code))
      .map<Diagnostic>((d) => ({
        from: doc.line(d.start_location.row).from + d.start_location.column - 1,
        to: doc.line(d.end_location.row).from + d.end_location.column - 1,
        severity: d.code?.match(/^invalid/) ? 'error' : 'warning',
        message: d.code ? d.code + ': ' + d.message : d.message
      }));
  });
}
