import { Diagnostic, linter } from '@codemirror/lint';
import ruffInit, {
  Workspace,
  type Diagnostic as RuffDiagnostic,
  PositionEncoding
} from '@astral-sh/ruff-wasm-web';

let ruffWorkspace: Workspace | null = null;
let initPromise: Promise<void> | null = null;

async function initRuff() {
  if (ruffWorkspace) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await ruffInit();
    ruffWorkspace = new Workspace(
      {
        builtins: [
          'array_create', // from openeo.processes
          'absolute', // from openeo.processes
          'and_', // from openeo.processes
          'if_', // from openeo.processes
          'RUN_CONFIG', // defined in code-runner.ts
          'datacube', // defined in loader.py
          'reduced', // defined in loader.py
          'add_graph_to_map' // defined in loader.py
        ],
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
