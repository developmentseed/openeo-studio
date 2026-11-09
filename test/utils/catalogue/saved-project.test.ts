jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

const mockLoadProject = jest.fn();

jest.mock('$stores/projects-store', () => ({
  useProjectsStore: {
    getState: () => ({
      loadProject: mockLoadProject
    })
  }
}));

import {
  projectToSeed,
  savedProjectLoader
} from '$utils/catalogue/loaders/saved-project';

const code = '```openeo-studio\nprint("hi")\n```';

const fullProject = {
  id: 'my-ndvi',
  summary: 'My NDVI',
  description: `Vegetation index.\n\n${code}`,
  process_graph: {
    load1: {
      process_id: 'load_collection',
      arguments: {
        id: 'sentinel-2-l2a',
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
    }
  },
  parameters: [
    { name: 'bands', default: ['B04', 'B08'] },
    { name: 'time', default: ['2025-01-01', '2025-02-01'] },
    { name: 'cloud_cover_max', default: 30 }
  ]
};

beforeEach(() => {
  mockLoadProject.mockReset();
});

describe('savedProjectLoader', () => {
  it('loads a saved project that auto-runs at its own id', async () => {
    mockLoadProject.mockResolvedValue(fullProject);
    const result = await savedProjectLoader.load('my-ndvi', {
      authToken: 't'
    });
    expect(mockLoadProject).toHaveBeenCalledWith('t', 'my-ndvi');
    expect(result).toEqual({
      projectId: 'my-ndvi',
      autoRun: true,
      seed: projectToSeed(fullProject)
    });
    expect(result.seed).toEqual({
      name: 'My NDVI',
      collectionId: 'sentinel-2-l2a',
      temporalRange: ['2025-01-01', '2025-02-01'],
      propertyFilters: [
        { property: 'eo:cloud_cover', operator: 'lt', value: 30 }
      ],
      bands: ['B04', 'B08'],
      boundingBox: undefined,
      suggestedAlgorithm: 'print("hi")'
    });
  });

  it('falls back to editor defaults', () => {
    expect(projectToSeed({ id: 'bare' })).toEqual({
      name: 'bare',
      collectionId: 'sentinel-2-l2a',
      temporalRange: ['', ''],
      propertyFilters: [],
      bands: [],
      boundingBox: undefined,
      suggestedAlgorithm: ''
    });
  });

  it('passes a load failure through', async () => {
    const boom = new Error('404');
    mockLoadProject.mockRejectedValue(boom);
    await expect(savedProjectLoader.load('x', {})).rejects.toBe(boom);
  });
});
