/**
 * @jest-environment node
 */
import { parseTileError, readAjaxError } from '$components/map/tile-error';

describe('tile error', () => {
  it('reads the openEO error of titiler-openeo, with advice', () => {
    const error = parseTileError(
      400,
      JSON.stringify({
        code: 'ItemsLimitExceeded',
        message:
          'Number of items in the workflow pipeline exceeds maximum allowed: 21 (max allowed: 20)'
      })
    );
    expect(error.code).toBe('ItemsLimitExceeded');
    expect(error.message).toContain('max allowed: 20');
    expect(error.advice).toMatch(/shorter date range/);
  });

  it('gives advice for no data', () => {
    const error = parseTileError(
      400,
      '{"code":"NoDataAvailable","message":"There is no data available for the given extents."}'
    );
    expect(error.advice).toMatch(/longer date range/);
  });

  it('keeps an unknown error without advice', () => {
    const error = parseTileError(
      400,
      '{"code":"InvalidRequest","message":"all input arrays must have the same shape"}'
    );
    expect(error).toEqual({
      code: 'InvalidRequest',
      message: 'all input arrays must have the same shape',
      advice: ''
    });
  });

  it('keeps a body that is not JSON', () => {
    expect(parseTileError(502, 'Bad Gateway')).toEqual({
      code: 'HTTP 502',
      message: 'Bad Gateway',
      advice: ''
    });
  });

  it('reads the status and the Blob body of a MapLibre AJAXError', async () => {
    const ajaxError = Object.assign(new Error('Bad Request'), {
      status: 400,
      body: new Blob(['{"code":"NoDataAvailable","message":"x"}'])
    });
    await expect(readAjaxError(ajaxError)).resolves.toEqual({
      status: 400,
      body: '{"code":"NoDataAvailable","message":"x"}'
    });
  });

  it('returns null for an error without an HTTP status', async () => {
    await expect(readAjaxError(new Error('network'))).resolves.toBeNull();
  });
});
