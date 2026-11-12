import { parseTileError } from '$components/map/use-map-tile-status';

// Same shape as MapLibre's AJAXError. jsdom's Blob may not support text().
const ajaxError = (status: number, body: string) => ({
  status,
  statusText: 'Error',
  url: 'https://tiles.test/10/546/369',
  message: 'AJAXError',
  body: { text: () => Promise.resolve(body) }
});

describe('parseTileError', () => {
  it('detects the openEO NoDataAvailable error', async () => {
    const error = ajaxError(
      404,
      JSON.stringify({
        code: 'NoDataAvailable',
        message: 'There is no data available for the given extents.'
      })
    );

    await expect(parseTileError(error)).resolves.toEqual({
      reason: 'no-data',
      message: 'There is no data available for the given extents.'
    });
  });

  it('uses the back-end message for other openEO errors', async () => {
    const error = ajaxError(
      500,
      JSON.stringify({ code: 'Internal', message: 'Something broke' })
    );

    await expect(parseTileError(error)).resolves.toEqual({
      reason: 'failed',
      message: 'Something broke'
    });
  });

  it('falls back to the HTTP status when the body is not JSON', async () => {
    const error = ajaxError(502, '<html>Bad Gateway</html>');

    await expect(parseTileError(error)).resolves.toEqual({
      reason: 'failed',
      message: 'HTTP 502'
    });
  });

  it('handles errors without a response', async () => {
    await expect(parseTileError(new Error('Network down'))).resolves.toEqual({
      reason: 'failed',
      message: 'Network down'
    });
  });
});
