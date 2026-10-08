import { extractHeadings } from '$pages/docs/headings';

describe('extractHeadings', () => {
  it('gives repeated headings unique ids and records their line', () => {
    const markdown = [
      '## Load',
      '### Parameters',
      '```',
      '## Not a heading',
      '```',
      '## Save',
      '### Parameters'
    ].join('\n');

    expect(extractHeadings(markdown)).toEqual([
      { id: 'load', text: 'Load', level: 2, line: 1 },
      { id: 'parameters', text: 'Parameters', level: 3, line: 2 },
      { id: 'save', text: 'Save', level: 2, line: 6 },
      { id: 'parameters-1', text: 'Parameters', level: 3, line: 7 }
    ]);
  });
});
