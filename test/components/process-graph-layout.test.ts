import { NODE_WIDTH, layoutGraph } from '$components/process-graph/layout';

describe('layoutGraph', () => {
  const chain = [
    { id: 'a', width: NODE_WIDTH, height: 60 },
    { id: 'b', width: NODE_WIDTH, height: 80 },
    { id: 'c', width: NODE_WIDTH, height: 40 }
  ];
  const edges = [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' }
  ];

  it('returns a position for every node', () => {
    const positions = layoutGraph(chain, edges);
    expect(Object.keys(positions).sort()).toEqual(['a', 'b', 'c']);
  });

  it('stacks a linear chain downwards', () => {
    const positions = layoutGraph(chain, edges);
    expect(positions.a.y).toBeLessThan(positions.b.y);
    expect(positions.b.y).toBeLessThan(positions.c.y);
  });

  it('returns top-left origins rather than dagre centres', () => {
    const positions = layoutGraph(chain, edges);
    // Dagre centres the first rank on y = height / 2; converting to a
    // top-left origin puts it at 0.
    expect(positions.a.y).toBe(0);
  });

  it('positions disconnected nodes without throwing', () => {
    const positions = layoutGraph(
      [
        { id: 'x', width: NODE_WIDTH, height: 50 },
        { id: 'y', width: NODE_WIDTH, height: 50 }
      ],
      []
    );
    expect(positions.x).toBeDefined();
    expect(positions.y).toBeDefined();
  });

  it('ignores edges whose endpoints are missing', () => {
    const positions = layoutGraph(
      [{ id: 'a', width: 220, height: 50 }],
      [{ source: 'a', target: 'ghost' }]
    );
    expect(Object.keys(positions)).toEqual(['a']);
  });
});
