import { buildGraphView } from '$components/process-graph/graph-model';
import type { ProcessGraph } from '$types/openeo-process';

const linearGraph: ProcessGraph = {
  lc1: {
    process_id: 'load_collection',
    arguments: {
      id: 'sentinel-2-l2a',
      bands: { from_parameter: 'bands' },
      properties: {
        'eo:cloud_cover': {
          process_graph: {
            cc: {
              process_id: 'lt',
              arguments: {
                x: { from_parameter: 'value' },
                y: { from_parameter: 'cloud_cover_max' }
              },
              result: true
            }
          }
        }
      }
    }
  },
  ad1: {
    process_id: 'apply_dimension',
    arguments: {
      data: { from_node: 'lc1' },
      dimension: 'bands',
      process: {
        process_graph: {
          ae1: {
            process_id: 'array_element',
            arguments: { data: { from_parameter: 'data' }, index: 0 },
            result: true
          }
        }
      }
    }
  },
  sr1: {
    process_id: 'save_result',
    arguments: { data: { from_node: 'ad1' }, format: 'PNG' },
    result: true
  }
};

function nodeById(graph: ProcessGraph, id: string) {
  return buildGraphView(graph).nodes.find((node) => node.id === id)!;
}

function argByName(graph: ProcessGraph, nodeId: string, argName: string) {
  return nodeById(graph, nodeId).args.find((arg) => arg.name === argName)!;
}

describe('buildGraphView', () => {
  describe('nodes', () => {
    it('emits one node per graph entry', () => {
      expect(buildGraphView(linearGraph).nodes.map((n) => n.id)).toEqual([
        'lc1',
        'ad1',
        'sr1'
      ]);
    });

    it('titles a load_collection node with its collection id', () => {
      const node = nodeById(linearGraph, 'lc1');
      expect(node.title).toBe('sentinel-2-l2a');
      expect(node.isCollection).toBe(true);
    });

    it('omits the id row on a load_collection node', () => {
      const names = nodeById(linearGraph, 'lc1').args.map((a) => a.name);
      expect(names).not.toContain('id');
    });

    it('titles other nodes with their process id', () => {
      const node = nodeById(linearGraph, 'ad1');
      expect(node.title).toBe('apply_dimension');
      expect(node.isCollection).toBe(false);
    });

    it('flags the result node', () => {
      expect(nodeById(linearGraph, 'sr1').isResult).toBe(true);
      expect(nodeById(linearGraph, 'ad1').isResult).toBe(false);
    });
  });

  describe('arguments', () => {
    it('marks an argument fed by an edge as wired with no display text', () => {
      const arg = argByName(linearGraph, 'ad1', 'data');
      expect(arg.kind).toBe('edge');
      expect(arg.wired).toBe(true);
      expect(arg.display).toBe('');
    });

    it('renders a parameter reference inline and leaves it unwired', () => {
      const arg = argByName(linearGraph, 'lc1', 'bands');
      expect(arg.kind).toBe('parameter-ref');
      expect(arg.wired).toBe(false);
      expect(arg.display).toBe('$bands');
    });

    it('formats a literal', () => {
      const arg = argByName(linearGraph, 'sr1', 'format');
      expect(arg.kind).toBe('literal');
      expect(arg.display).toBe('PNG');
    });
  });

  describe('subgraph discovery', () => {
    it('finds a subgraph at the argument root', () => {
      const arg = argByName(linearGraph, 'ad1', 'process');
      expect(arg.kind).toBe('subgraph');
      expect(arg.subgraph).toEqual({
        graph: expect.objectContaining({ ae1: expect.anything() }),
        path: '',
        nodeCount: 1
      });
    });

    it('finds a subgraph nested inside an argument object', () => {
      const arg = argByName(linearGraph, 'lc1', 'properties');
      expect(arg.kind).toBe('subgraph');
      expect(arg.subgraph?.path).toBe('eo:cloud_cover');
      expect(arg.subgraph?.nodeCount).toBe(1);
    });
  });

  describe('edges', () => {
    it('links a from_node reference to the argument that holds it', () => {
      const { edges } = buildGraphView(linearGraph);
      expect(edges).toContainEqual({
        id: 'lc1->ad1:data',
        source: 'lc1',
        target: 'ad1',
        targetHandle: 'data'
      });
    });

    it('does not emit edges for references inside a nested subgraph', () => {
      const { edges } = buildGraphView(linearGraph);
      expect(edges).toHaveLength(2);
    });

    it('emits one edge per reference in an array argument', () => {
      const graph: ProcessGraph = {
        a: { process_id: 'constant', arguments: { x: 1 } },
        b: { process_id: 'constant', arguments: { x: 2 } },
        c: {
          process_id: 'array_create',
          arguments: { data: [{ from_node: 'a' }, { from_node: 'b' }] },
          result: true
        }
      };
      const { edges } = buildGraphView(graph);
      expect(edges.map((e) => e.id)).toEqual(['a->c:data', 'b->c:data']);
      expect(edges.every((e) => e.label === undefined)).toBe(true);
    });

    it('labels edges when the target has more than one wired argument', () => {
      const graph: ProcessGraph = {
        a: { process_id: 'constant', arguments: { x: 1 } },
        b: { process_id: 'constant', arguments: { x: 2 } },
        c: {
          process_id: 'subtract',
          arguments: { x: { from_node: 'a' }, y: { from_node: 'b' } },
          result: true
        }
      };
      const { edges } = buildGraphView(graph);
      expect(edges.map((e) => e.label)).toEqual(['x', 'y']);
    });

    it('skips references to nodes that are not in the graph', () => {
      const graph: ProcessGraph = {
        c: {
          process_id: 'save_result',
          arguments: { data: { from_node: 'missing' } },
          result: true
        }
      };
      expect(buildGraphView(graph).edges).toEqual([]);
    });
  });
});
