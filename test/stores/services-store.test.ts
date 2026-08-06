jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

const mockListPermanentServices = jest.fn();
const mockFetchJson = jest.fn();

jest.mock('$utils/openeo/permanent-services', () => ({
  listPermanentServices: (...args: unknown[]) =>
    mockListPermanentServices(...args)
}));

jest.mock('$utils/openeo/services', () => ({
  getServiceUrl: (id: string) => `https://example.test/openeo/services/${id}`
}));

jest.mock('$utils/api', () => ({
  fetchJson: (...args: unknown[]) => mockFetchJson(...args),
  APIError: class APIError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'APIError';
    }
  }
}));

import { useServicesStore } from '$stores/services-store';
import type { BackendService } from '$types';

const sampleService: BackendService = {
  id: 'svc-1',
  url: 'https://tiles.example/{z}/{x}/{y}',
  title: 'openeo-studio:permanent:abc',
  type: 'XYZ',
  enabled: true,
  configuration: { scope: 'public', layerName: 'NDVI' },
  created: '2026-01-01T00:00:00Z'
};

function resetStore() {
  useServicesStore.setState({
    services: [],
    isLoading: false,
    isSuccess: false,
    error: null
  });
}

describe('services-store', () => {
  beforeEach(() => {
    resetStore();
    mockListPermanentServices.mockReset();
    mockFetchJson.mockReset();
  });

  it('fetchServices loads permanent services into state', async () => {
    mockListPermanentServices.mockResolvedValue([sampleService]);

    await useServicesStore.getState().fetchServices('token');

    expect(mockListPermanentServices).toHaveBeenCalledWith('token');
    expect(useServicesStore.getState().services).toEqual([sampleService]);
    expect(useServicesStore.getState().isLoading).toBe(false);
    expect(useServicesStore.getState().isSuccess).toBe(true);
    expect(useServicesStore.getState().error).toBeNull();
  });

  it('fetchServices sets error on failure', async () => {
    mockListPermanentServices.mockRejectedValue(new Error('network down'));

    await useServicesStore.getState().fetchServices('token');

    expect(useServicesStore.getState().services).toEqual([]);
    expect(useServicesStore.getState().isLoading).toBe(false);
    expect(useServicesStore.getState().isSuccess).toBe(false);
    expect(useServicesStore.getState().error?.message).toBe('network down');
  });

  it('deleteService removes the service after a successful DELETE', async () => {
    useServicesStore.setState({ services: [sampleService] });
    mockFetchJson.mockResolvedValue(undefined);

    await useServicesStore.getState().deleteService('token', 'svc-1');

    expect(mockFetchJson).toHaveBeenCalledWith(
      'https://example.test/openeo/services/svc-1',
      'token',
      { method: 'DELETE' }
    );
    expect(useServicesStore.getState().services).toEqual([]);
  });

  it('deleteService leaves the service in place when DELETE fails', async () => {
    useServicesStore.setState({ services: [sampleService] });
    mockFetchJson.mockRejectedValue(new Error('forbidden'));

    await expect(
      useServicesStore.getState().deleteService('token', 'svc-1')
    ).rejects.toThrow('forbidden');

    expect(useServicesStore.getState().services).toEqual([sampleService]);
  });

  it('updateServiceScope PATCHes full configuration and updates state', async () => {
    useServicesStore.setState({ services: [sampleService] });
    mockFetchJson.mockResolvedValue(undefined);

    await useServicesStore
      .getState()
      .updateServiceScope('token', sampleService, 'private');

    expect(mockFetchJson).toHaveBeenCalledWith(
      'https://example.test/openeo/services/svc-1',
      'token',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuration: { scope: 'private', layerName: 'NDVI' }
        })
      }
    );
    expect(useServicesStore.getState().services[0].configuration.scope).toBe(
      'private'
    );
  });

  it('updateServiceScope works when the service is not in the list cache', async () => {
    mockFetchJson.mockResolvedValue(undefined);

    await useServicesStore
      .getState()
      .updateServiceScope('token', sampleService, 'private');

    expect(useServicesStore.getState().services).toHaveLength(1);
    expect(useServicesStore.getState().services[0].configuration.scope).toBe(
      'private'
    );
  });

  it('updateServiceScope leaves state unchanged when PATCH fails', async () => {
    useServicesStore.setState({ services: [sampleService] });
    mockFetchJson.mockRejectedValue(new Error('bad request'));

    await expect(
      useServicesStore
        .getState()
        .updateServiceScope('token', sampleService, 'private')
    ).rejects.toThrow('bad request');

    expect(useServicesStore.getState().services[0].configuration.scope).toBe(
      'public'
    );
  });
});
