import { Diagnostic, linter } from '@codemirror/lint';
import {
  Workspace,
  type Diagnostic as RuffDiagnostic,
  PositionEncoding
} from '@astral-sh/ruff-wasm-web';

export function ruffLinter() {
  const ruffWorkspace = new Workspace(
    {
      builtins: ['array_create', 'datacube'],
      'target-version': 'py310',
      'line-length': 88,
      'indent-width': 4,
      lint: {
        'allowed-confusables': [],
        'dummy-variable-rgx': '^(_+|(_+[a-zA-Z0-9_]*[a-zA-Z0-9]+?))$',
        'extend-select': [],
        'extend-fixable': [],
        external: [],
        ignore: [],
        select: ['F', 'E4', 'E7', 'E9']
      },
      format: {
        'indent-style': 'space',
        'quote-style': 'double'
      }
    },
    PositionEncoding.Utf16
  );

  return linter((view) => {
    const doc = view.state.doc;
    const res: RuffDiagnostic[] = ruffWorkspace.check(doc.toString());

    return res.map<Diagnostic>((d) => ({
      from: doc.line(d.start_location.row).from + d.start_location.column - 1,
      to: doc.line(d.end_location.row).from + d.end_location.column - 1,
      severity: d.code?.match(/^invalid/) ? 'error' : 'warning',
      message: d.code ? d.code + ': ' + d.message : d.message
    }));
  });
}
