import { useState, useEffect } from 'react';
import { loadPyodide, PyodideAPI, version as pyodideVersion } from 'pyodide';
import ruffInit from '@astral-sh/ruff-wasm-web';
import loaderScript from '../algorithms/base/loader.py?raw';
import trueColorAlgorithm from '../algorithms/visualizations/true-color.py?raw';

export const EXAMPLE_CODE = trueColorAlgorithm;

/**
 * Combines the base loader script with an algorithm script to create
 * a complete Python program for execution.
 */
function getPythonCode(algorithmScript: string) {
  return `${loaderScript}

${algorithmScript}
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
