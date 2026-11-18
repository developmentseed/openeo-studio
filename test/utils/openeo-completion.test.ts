import { CompletionContext } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';

import { OP_MEMBER_NAMES } from '../../app/algorithms/base/environment';
import { openeoCompletionSource } from '../../app/utils/openeo-completion';

function complete(doc: string, explicit = false) {
  const state = EditorState.create({ doc });
  const result = openeoCompletionSource(
    new CompletionContext(state, doc.length, explicit)
  );
  return result && result.options.map((option) => option.label);
}

describe('openeoCompletionSource', () => {
  it('maps bare names to openeo.processes members', () => {
    expect(OP_MEMBER_NAMES).toEqual(
      expect.arrayContaining(['max', 'round', 'all', 'if_', 'and_', 'clip'])
    );
    expect(OP_MEMBER_NAMES).not.toContain('max_');
  });

  it('completes processes after op.', () => {
    const labels = complete('x = op.cl');
    expect(labels).toContain('clip');
    expect(labels).not.toContain('datacube');
  });

  it('completes globals at the top level', () => {
    const labels = complete('x = red');
    expect(labels).toEqual(
      expect.arrayContaining(['reduced', 'datacube', 'add_graph_to_map', 'op'])
    );
  });

  it('skips other attribute access', () => {
    expect(complete('x = foo.da')).toBeNull();
    expect(complete('x = loop.cl')).toBeNull();
  });
});
