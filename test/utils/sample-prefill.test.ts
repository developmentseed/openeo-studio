/**
 * @jest-environment node
 */
import {
  decodeSamplePrefill,
  encodeSamplePrefill,
  fetchSamplePrefill,
  MAX_CODE_LENGTH,
  readSamplePrefill,
  SamplePrefillError,
  validateSamplePrefill
} from '$utils/sample-prefill';
import type { SamplePrefill } from '$types/sample-prefill';

const SAMPLE: SamplePrefill = {
  name: 'NDVI à Rome',
  code: 'add_graph_to_map(reduced.save_result("PNG"), "x")\n',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['2025-07-01', '2025-07-15'],
  bands: ['reflectance|bands=b04', 'reflectance|bands=b08'],
  boundingBox: [12.35, 41.8, 12.6, 41.98],
  cloudCover: 20
};

describe('sample prefill', () => {
  it('encodes and decodes UTF-8 JSON as base64url', () => {
    const encoded = encodeSamplePrefill(SAMPLE);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeSamplePrefill(encoded)).toEqual(SAMPLE);
  });

  it('decodes the output of Python urlsafe_b64encode without padding', () => {
    // base64.urlsafe_b64encode(b'{"a":"\xc3\xa9?"}').rstrip(b"=")
    expect(decodeSamplePrefill('eyJhIjoiw6k_In0')).toEqual({ a: 'é?' });
  });

  it('rejects text that is not base64url or not JSON', () => {
    expect(() => decodeSamplePrefill('***')).toThrow(SamplePrefillError);
    expect(() => decodeSamplePrefill(btoa('not json'))).toThrow('not JSON');
  });

  it('accepts a valid sample and drops unknown fields', () => {
    const result = validateSamplePrefill({ ...SAMPLE, $schema: 'x', extra: 1 });
    expect(result).toEqual(SAMPLE);
  });

  it.each([
    ['no code', { ...SAMPLE, code: '  ' }, '"code"'],
    [
      'long code',
      { ...SAMPLE, code: 'x'.repeat(MAX_CODE_LENGTH + 1) },
      '"code"'
    ],
    ['no collection', { ...SAMPLE, collectionId: '' }, '"collectionId"'],
    [
      'bad date',
      { ...SAMPLE, temporalRange: ['2025-7-1', '2025-07-15'] },
      '"temporalRange"'
    ],
    ['no bands', { ...SAMPLE, bands: [] }, '"bands"'],
    ['bad bbox', { ...SAMPLE, boundingBox: [1, 2, 3] }, '"boundingBox"'],
    ['bad cloud cover', { ...SAMPLE, cloudCover: 101 }, '"cloudCover"'],
    ['not an object', [SAMPLE], 'JSON object']
  ])('rejects a sample with %s', (_, value, message) => {
    expect(() => validateSamplePrefill(value)).toThrow(message);
  });

  it('reads ?sample= from the query', async () => {
    const params = new URLSearchParams({ sample: encodeSamplePrefill(SAMPLE) });
    await expect(readSamplePrefill(params)).resolves.toEqual(SAMPLE);
  });

  it('returns null when the query has no sample', async () => {
    await expect(readSamplePrefill(new URLSearchParams())).resolves.toBeNull();
  });

  it('fetches ?sampleUrl= without credentials', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => SAMPLE
    });
    const params = new URLSearchParams({
      sampleUrl: 'https://gist.example.org/sample.json'
    });
    await expect(readSamplePrefill(params, fetchFn)).resolves.toEqual(SAMPLE);
    expect(fetchFn).toHaveBeenCalledWith(
      'https://gist.example.org/sample.json',
      { credentials: 'omit' }
    );
  });

  it('refuses a sample URL that is not https', async () => {
    const fetchFn = jest.fn();
    await expect(
      fetchSamplePrefill('http://example.org/sample.json', fetchFn)
    ).rejects.toThrow('https');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('reports an HTTP error of the sample URL', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(
      fetchSamplePrefill('https://example.org/sample.json', fetchFn)
    ).rejects.toThrow('HTTP 404');
  });
});
