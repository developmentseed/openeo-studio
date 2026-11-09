/**
 * @jest-environment node
 */

import { encodedUrlLoader } from '$utils/catalogue/loaders/encoded-url';
import { NotFound } from '$utils/errors';

const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const project = {
  name: 'NDVI à Rome',
  code: 'print("ndvi")',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['2025-07-01', '2025-07-15'],
  bands: ['B04', 'B08'],
  boundingBox: [12.35, 41.8, 12.6, 41.98],
  propertyFilters: [{ property: 'eo:cloud_cover', operator: 'lt', value: 20 }]
};

const load = (value: unknown) => encodedUrlLoader.load(encode(value), {});

describe('encodedUrlLoader', () => {
  it('loads the project as external code, without auto-run', async () => {
    await expect(load(project)).resolves.toEqual({
      autoRun: false,
      external: true,
      incompatibilities: [],
      seed: {
        name: 'NDVI à Rome',
        collectionId: 'sentinel-2-l2a',
        temporalRange: ['2025-07-01', '2025-07-15'],
        propertyFilters: project.propertyFilters,
        bands: ['B04', 'B08'],
        boundingBox: [12.35, 41.8, 12.6, 41.98],
        suggestedAlgorithm: 'print("ndvi")'
      }
    });
  });

  it('names a project without a name', async () => {
    const { name: _, ...unnamed } = project;
    const { seed } = await load(unnamed);
    expect(seed.name).toBe('Project from a link');
  });

  it('has no filters when the project has none', async () => {
    const { propertyFilters: _, ...unfiltered } = project;
    const { seed } = await load(unfiltered);
    expect(seed.propertyFilters).toEqual([]);
  });

  it('leaves out and names malformed optional values', async () => {
    const badFilter = { property: 'x', operator: 'like', value: 1 };
    const result = await load({
      ...project,
      propertyFilters: [project.propertyFilters[0], badFilter],
      boundingBox: [0, 95, 1, 96]
    });
    expect(result.seed.propertyFilters).toEqual(project.propertyFilters);
    expect(result.seed.boundingBox).toBeUndefined();
    expect(result.seed.suggestedAlgorithm).toBe('print("ndvi")');
    expect(result.incompatibilities).toEqual([
      `Property filter ${JSON.stringify(badFilter)} is not valid.`,
      'Bounding box [0,95,1,96] is not valid.'
    ]);
  });

  it('rejects a ref that is not base64url JSON', async () => {
    const error = await encodedUrlLoader.load('%%%', {}).catch((e) => e);
    expect(error).toBeInstanceOf(NotFound);
    expect(error.message).toBe(
      'Invalid project in the link: not base64url JSON'
    );
  });

  it.each(['code', 'collectionId', 'temporalRange', 'bands'])(
    'rejects a project missing %s',
    async (field) => {
      const broken: Record<string, unknown> = { ...project };
      delete broken[field];
      const error = await load(broken).catch((e) => e);
      expect(error).toBeInstanceOf(NotFound);
      expect(error.message).toBe(
        `Invalid project in the link: missing \`${field}\``
      );
    }
  );

  it('rejects a date that is not YYYY-MM-DD', async () => {
    await expect(
      load({ ...project, temporalRange: ['July', '2025-07-15'] })
    ).rejects.toThrow('missing `temporalRange`');
  });
});
