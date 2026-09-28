jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

jest.mock('$utils/instance-id', () => ({
  getInstanceId: () => 'test-instance-id'
}));

jest.mock('../../app/algorithms/base/loader.py?raw', () => 'LOADER', {
  virtual: true
});
jest.mock(
  '../../app/algorithms/visualizations/true-color.py?raw',
  () => 'TRUE_COLOR',
  { virtual: true }
);

const fetchJson = jest.fn();
const fetchHeaderLocation = jest.fn();

jest.mock('$utils/api', () => ({
  fetchJson: (...args: unknown[]) => fetchJson(...args),
  fetchHeaderLocation: (...args: unknown[]) => fetchHeaderLocation(...args)
}));

import {
  createServicesFromGraphs,
  runAndValidateScript
} from '$utils/code-runner';
import type { GraphResult } from '$types';

const graph: GraphResult = {
  name: 'layer',
  process_graph: {
    loadcollection1: {
      process_id: 'load_collection',
      arguments: { id: 'sentinel-2-l2a' },
      result: true
    }
  },
  parameters: [],
  visible: true
};

describe('runAndValidateScript', () => {
  beforeEach(() => {
    fetchJson.mockReset();
    fetchHeaderLocation.mockReset();
  });

  it('runs the script and validates graphs, returning graphs only', async () => {
    const pyodide = {
      runPythonAsync: jest.fn().mockResolvedValue(JSON.stringify([graph]))
    };
    fetchJson.mockResolvedValue({ errors: [] });

    const graphs = await runAndValidateScript(
      pyodide as never,
      'token',
      'print("hi")',
      {
        collectionId: 'sentinel-2-l2a',
        selectedBands: [],
        temporalRange: [],
        boundingBox: [0, 0, 1, 1],
        cloudCover: 20
      }
    );

    expect(graphs).toEqual([graph]);
    expect(fetchHeaderLocation).not.toHaveBeenCalled();
  });
});

describe('createServicesFromGraphs', () => {
  beforeEach(() => {
    fetchJson.mockReset();
    fetchHeaderLocation.mockReset();
  });

  it('returns no services when there are no graphs', async () => {
    fetchJson.mockResolvedValue({ services: [] });

    const services = await createServicesFromGraphs([], 'token');

    expect(services).toEqual([]);
    expect(fetchHeaderLocation).not.toHaveBeenCalled();
  });

  it('creates ephemeral services for each graph', async () => {
    fetchJson
      .mockResolvedValueOnce({ services: [] }) // orphan cleanup list
      .mockResolvedValueOnce({ url: 'https://tiles.example/{z}/{x}/{y}' }); // tile url
    fetchHeaderLocation.mockResolvedValue(
      'https://example.test/openeo/services/svc-1'
    );

    const services = await createServicesFromGraphs([graph], 'token');

    expect(services).toHaveLength(1);
    expect(services[0]?.tileUrl).toBe('https://tiles.example/{z}/{x}/{y}');
    expect(services[0]?.graphResult).toEqual(graph);
    expect(fetchHeaderLocation).toHaveBeenCalled();
  });
});
