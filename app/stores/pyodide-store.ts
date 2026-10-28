import { useEffect } from 'react';
import { create } from 'zustand';
import type { PyodideAPI, loadPyodide as LoadPyodide } from 'pyodide';
import ruffInit from '@astral-sh/ruff-wasm-web';

export type PythonSetupStepId = 'runtime' | 'openeo' | 'linter';
export type PythonSetupStepStatus = 'pending' | 'active' | 'done' | 'error';

export const PYTHON_SETUP_STEPS: { id: PythonSetupStepId; label: string }[] = [
  { id: 'runtime', label: 'Python runtime' },
  { id: 'openeo', label: 'openEO client library' },
  { id: 'linter', label: 'Code linter' }
];

type PyodideState = {
  pyodide: PyodideAPI | undefined;
  status: 'idle' | 'loading' | 'ready' | 'error';
  steps: Record<PythonSetupStepId, PythonSetupStepStatus>;
  error: string | null;
};

const initialSteps: PyodideState['steps'] = {
  runtime: 'pending',
  openeo: 'pending',
  linter: 'pending'
};

const usePyodideStore = create<PyodideState>(() => ({
  pyodide: undefined,
  status: 'idle',
  steps: initialSteps,
  error: null
}));

function setStep(id: PythonSetupStepId, status: PythonSetupStepStatus) {
  usePyodideStore.setState((state) => ({
    steps: { ...state.steps, [id]: status }
  }));
}

/** Runs one setup step and records its progress. */
async function runStep<T>(
  id: PythonSetupStepId,
  task: () => Promise<T>
): Promise<T> {
  setStep(id, 'active');
  try {
    const result = await task();
    setStep(id, 'done');
    return result;
  } catch (error) {
    setStep(id, 'error');
    throw error;
  }
}

/**
 * Loads Pyodide with the openEO package and the Ruff linter. Pyodide is
 * imported on demand, so pages that do not run Python do not download it.
 */
async function initializePyodide(): Promise<PyodideAPI> {
  // Playwright tests inject window.loadPyodide to avoid WebAssembly OOM.
  // Prefer that override when present and skip CDN/package setup.
  const windowLoader = (window as Window & { loadPyodide?: typeof LoadPyodide })
    .loadPyodide;

  if (typeof windowLoader === 'function') {
    const pyodide = await runStep('runtime', () => windowLoader({}));
    setStep('openeo', 'done');
    setStep('linter', 'done');
    return pyodide;
  }

  const pyodide = await runStep('runtime', async () => {
    const { loadPyodide, version } = await import('pyodide');
    return loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`
    });
  });

  // Pinned below 0.50 because openeo 0.50.0 added geopandas as a hard
  // runtime dependency, which currently fails to resolve in Pyodide.
  // See https://github.com/developmentseed/openeo-studio/issues/70
  // micropip takes pystac and deprecated from PyPI, so they are pinned to
  // their latest versions when openeo 0.49.0 came out: a new release must
  // not change what users run. (openeo 0.49.0 already caps xarray.)
  await runStep('openeo', async () => {
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');
    await micropip.install.callKwargs('openeo==0.49.0', {
      constraints: ['pystac==1.14.3', 'deprecated==1.3.1']
    });
  });

  await runStep('linter', () => ruffInit());

  return pyodide;
}

/**
 * Starts loading Pyodide. It loads once per page session; calling it again
 * while it loads or after it is ready does nothing. After a failure, it
 * starts again.
 */
export function loadPython() {
  const { status } = usePyodideStore.getState();
  if (status === 'loading' || status === 'ready') return;

  usePyodideStore.setState({
    status: 'loading',
    steps: initialSteps,
    error: null
  });

  initializePyodide()
    .then((pyodide) => usePyodideStore.setState({ pyodide, status: 'ready' }))
    .catch((error: Error) => {
      // eslint-disable-next-line no-console
      console.error('Pyodide initialization error:', error);
      usePyodideStore.setState({ status: 'error', error: error.message });
    });
}

/**
 * Gives access to Pyodide and starts loading it on first use.
 */
export function usePyodide() {
  const state = usePyodideStore();

  useEffect(() => {
    loadPython();
  }, []);

  return { ...state, retry: loadPython };
}
