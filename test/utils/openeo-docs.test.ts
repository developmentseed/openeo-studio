import { EditorState } from '@codemirror/state';

import { OP_MEMBER_NAMES } from '../../app/algorithms/base/environment';
import * as docsJson from '../../app/algorithms/base/openeo-process-docs.json';
import * as processesJson from '../../app/algorithms/base/openeo-processes.json';
import {
  renderGlobalDoc,
  renderProcessDoc,
  symbolAt
} from '../../app/utils/openeo-docs';

function symbol(doc: string, pos: number) {
  const found = symbolAt(EditorState.create({ doc }), pos);
  return found && `${found.kind}:${found.name}`;
}

describe('openEO process docs', () => {
  it('documents every op member, from the same client version', () => {
    expect(Object.keys(docsJson.processes).sort()).toEqual(
      [...OP_MEMBER_NAMES].sort()
    );
    expect(docsJson.openeoVersion).toBe(processesJson.openeoVersion);
  });

  it('finds the process under the cursor', () => {
    expect(symbol('x = op.max(a)', 8)).toBe('process:max');
    expect(symbol('x = op.if_(a)', 8)).toBe('process:if_');
    // Bare names map to their op name.
    expect(symbol('x = max_(a)', 5)).toBe('process:max');
    expect(symbol('x = clip(a)', 5)).toBe('process:clip');
  });

  it('finds the documented globals', () => {
    expect(symbol('x = reduced', 5)).toBe('global:reduced');
    expect(symbol('x = op.max(a)', 4)).toBe('global:op');
    expect(symbol('f(bands)', 3)).toBe('global:bands');
    expect(symbol('x = data.time', 10)).toBeNull();
  });

  it('ignores names that are not openEO processes', () => {
    expect(symbol('x = max(a)', 5)).toBeNull();
    expect(symbol('x = data.clip(a)', 10)).toBeNull();
    expect(symbol('x = op.nope(a)', 8)).toBeNull();
  });

  it('renders the signature, parameters and a link', () => {
    const dom = renderProcessDoc('if_', docsJson.processes.if_);
    expect(dom.textContent).toContain('op.if_(value, accept, reject=…)');
    expect(dom.textContent).toContain('If-Then-Else conditional');
    expect(dom.querySelector('a')?.getAttribute('href')).toBe(
      'https://processes.openeo.org/#if'
    );
  });

  it('renders a global with its type', () => {
    const dom = renderGlobalDoc({
      name: 'time',
      type: 'Parameter',
      description: 'The time range.'
    });
    expect(dom.textContent).toBe('time: ParameterThe time range.');
  });
});
