import { useState, useEffect } from 'react';
import { loadPyodide, PyodideAPI, version as pyodideVersion } from 'pyodide';
import ruffInit from '@astral-sh/ruff-wasm-web';
import trueColorAlgorithm from '../algorithms/true-color.py?raw';

export const EXAMPLE_CODE = trueColorAlgorithm;

function getPythonCode(content: string) {
  return `
from openeo.internal.graph_building import  PGNode
from openeo.rest.datacube import DataCube
from openeo.rest.result import SaveResult
from openeo.processes import array_create, if_, absolute, and_

graph = PGNode("load_collection",  url="s3://esa-zarr-sentinel-explorer-fra/tests-output/sentinel-2-l2a/S2A_MSIL2A_20250922T112131_N0511_R037_T29SMD_20250922T160420.zarr",
    spatial_extent={
        "east": {
            "from_parameter": "spatial_extent_east"
        },
        "north": {
           "from_parameter": "spatial_extent_north"
        },
        "south": {
            "from_parameter": "spatial_extent_south"
        },
        "west": {
           "from_parameter": "spatial_extent_west"
        },
        "crs": {
            "from_parameter": "spatial_extent_crs"
        }
    },
    options={
        "variables": [
            "/measurements/reflectance/r10m:b02",
            "/measurements/reflectance/r10m:b03",
            "/measurements/reflectance/r10m:b04",
            "/measurements/reflectance/r20m:b05",
            "/measurements/reflectance/r20m:b07",
            "/measurements/reflectance/r10m:b08",
            "/measurements/reflectance/r20m:b8a",
            "/measurements/reflectance/r20m:b11",
            "/measurements/reflectance/r20m:b12",
        ],
        "width": 1024,
        "height": 1024,
    },)
datacube = DataCube(graph=graph)

B02 = datacube.band("/measurements/reflectance/r10m:b02")  # Blue
B03 = datacube.band("/measurements/reflectance/r10m:b03")  # Green
B04 = datacube.band("/measurements/reflectance/r10m:b04")  # Red
B05 = datacube.band("/measurements/reflectance/r20m:b05")  # Red Edge 1
B07 = datacube.band("/measurements/reflectance/r20m:b07")  # Red Edge 3
B08 = datacube.band("/measurements/reflectance/r10m:b08")  # NIR
B8A = datacube.band("/measurements/reflectance/r20m:b8a")  # Narrow NIR
B11 = datacube.band("/measurements/reflectance/r20m:b11")  # SWIR 1
B12 = datacube.band("/measurements/reflectance/r20m:b12")  # SWIR 2

${content}

`;
}

export function usePyodide() {
  const [pyodide, setPyodide] = useState<PyodideAPI | undefined>();
  const [log, setLog] = useState<
    { message: string; type: 'info' | 'success' | 'error' }[]
  >([]);

  useEffect(() => {
    async function load() {
      try {
        setLog((v) => [
          ...v,
          { message: 'Loading Pyodide runtime...', type: 'info' }
        ]);

        const pyodide = await loadPyodide({
          indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`
        });
        setLog((v) => [
          ...v,
          { message: 'Pyodide loaded successfully', type: 'success' }
        ]);
        setLog((v) => [
          ...v,
          { message: 'Installing openeo package...', type: 'info' }
        ]);

        // Install openeo package
        await pyodide.loadPackage('micropip');
        const micropip = pyodide.pyimport('micropip');
        await micropip.install('openeo');
        setLog((v) => [
          ...v,
          { message: 'openeo package installed', type: 'success' }
        ]);

        // Initialize ruff linter
        setLog((v) => [
          ...v,
          { message: 'Loading Ruff linter...', type: 'info' }
        ]);
        await ruffInit();
        setLog((v) => [
          ...v,
          { message: 'Ruff linter loaded', type: 'success' }
        ]);

        setPyodide(pyodide);
      } catch (error) {
        setLog((v) => [
          ...v,
          {
            message: `Failed to load Pyodide: ${(error as Error).message}`,
            type: 'error'
          }
        ]);
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }

    load();
  }, []);

  return { pyodide, log };
}

export async function processScript(
  pyodide: PyodideAPI,
  authToken: string,
  script: string
) {
  try {
    const result = await pyodide?.runPythonAsync(getPythonCode(script));
    const graph = JSON.parse(result);
    // eslint-disable-next-line no-console
    console.log(
      'request data',
      JSON.stringify({
        title: 'Quick view',
        description: null,
        type: 'XYZ',
        enabled: true,
        configuration: {},
        plan: null,
        budget: null,
        process: graph
      })
    );

    const response = await fetch(
      'https://api.explorer.eopf.copernicus.eu/openeo/services',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer oidc/oidc/${authToken}`
        },
        body: JSON.stringify({
          title: 'Quick view',
          description: null,
          type: 'XYZ',
          enabled: true,
          configuration: {
            scope: 'public'
          },
          plan: null,
          budget: null,
          process: graph
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create service (${response.status}): ${errorText}`
      );
    }

    const location = response.headers.get('location');

    if (!location) {
      throw new Error('No location header in response');
    }

    const tileRespose = await fetch(location, {
      headers: {
        Authorization: `Bearer oidc/oidc/${authToken}`
      }
    });

    const tileJson = await tileRespose.json();

    return tileJson.url;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error executing Python code:', error);
  }
}
