jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

import {
  backendServiceToServiceInfo,
  getServiceZoom
} from '$utils/openeo/service-adapters';

const service = {
  id: 's1',
  url: 'https://tiles.example/{z}/{x}/{y}',
  title: 'Layer',
  type: 'XYZ',
  enabled: true,
  configuration: { scope: 'public', minZoom: 6, maxZoom: 15 }
};

describe('getServiceZoom', () => {
  it('reads numeric zoom limits', () => {
    expect(getServiceZoom({ minZoom: 6, maxZoom: 15 })).toEqual({
      minZoom: 6,
      maxZoom: 15
    });
  });

  it('ignores missing or non-numeric limits', () => {
    expect(getServiceZoom(undefined)).toEqual({});
    expect(getServiceZoom({ minZoom: '6' })).toEqual({});
  });
});

describe('backendServiceToServiceInfo', () => {
  it('carries the zoom limits', () => {
    const info = backendServiceToServiceInfo(service, true);
    expect(info.minZoom).toBe(6);
    expect(info.maxZoom).toBe(15);
  });
});
