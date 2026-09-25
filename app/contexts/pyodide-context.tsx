import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { loadPyodide, PyodideAPI, version } from 'pyodide';
import ruffInit from '@astral-sh/ruff-wasm-web';

// Types
type LogEntry = { message: string; type: 'info' | 'success' | 'error' };

interface PyodideContextValue {
  pyodide: PyodideAPI | undefined;
  log: LogEntry[];
  isLoading: boolean;
}

const PyodideContext = createContext<PyodideContextValue | undefined>(
  undefined
);

/**
 * Helper to add log entries in a functional way
 */
function createLogEntry(
  message: string,
  type: LogEntry['type'] = 'info'
): LogEntry {
  return { message, type };
}

/**
 * Initializes Pyodide with OpenEO package and Ruff linter.
 *
 * @param onLog - Callback for logging messages
 * @returns Initialized Pyodide instance
 */
async function initializePyodide(
  onLog: (entry: LogEntry) => void
): Promise<PyodideAPI> {
  // Playwright tests inject window.loadPyodide to avoid WebAssembly OOM.
  // Prefer that override when present and skip CDN/package setup.
  const windowLoader =
    typeof window !== 'undefined'
      ? (
          window as Window & {
            loadPyodide?: typeof loadPyodide;
          }
        ).loadPyodide
      : undefined;
  const isTestMock = typeof windowLoader === 'function';

  onLog(createLogEntry('Python ready', 'success'));

  onLog(
    createLogEntry(
      isTestMock
        ? 'Loading mock Pyodide runtime...'
        : 'Loading Pyodide runtime...'
    )
  );
  const pyodideInstance = await (windowLoader ?? loadPyodide)({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`
  });
  onLog(createLogEntry('Pyodide loaded successfully', 'success'));

  if (isTestMock) {
    return pyodideInstance;
  }

  // Install OpenEO package.
  // Pinned to <0.50 because openeo 0.50.0 added geopandas as a hard
  // runtime dependency, which currently fails to resolve in Pyodide.
  // See https://github.com/developmentseed/openeo-studio/issues/70
  onLog(createLogEntry('Installing openeo package...'));
  await pyodideInstance.loadPackage('micropip');
  const micropip = pyodideInstance.pyimport('micropip');
  await micropip.install('openeo<0.50');
  onLog(createLogEntry('openeo package installed', 'success'));

  // Initialize Ruff linter
  onLog(createLogEntry('Loading Ruff linter...'));
  await ruffInit();
  onLog(createLogEntry('Ruff linter loaded', 'success'));

  return pyodideInstance;
}

export function PyodideProvider({ children }: { children: ReactNode }) {
  const [pyodide, setPyodide] = useState<PyodideAPI | undefined>();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const addLog = (entry: LogEntry) => {
      if (mounted) {
        setLog((prev) => [...prev, entry]);
      }
    };

    async function load() {
      addLog(createLogEntry('Loading Python environment...'));

      try {
        const pyodideInstance = await initializePyodide(addLog);

        if (mounted) {
          setPyodide(pyodideInstance);
        }
      } catch (error) {
        if (mounted) {
          addLog(
            createLogEntry(
              `Failed to load Pyodide: ${(error as Error).message}`,
              'error'
            )
          );
          // eslint-disable-next-line no-console
          console.error('Pyodide initialization error:', error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PyodideContext.Provider value={{ pyodide, log, isLoading }}>
      {children}
    </PyodideContext.Provider>
  );
}

export function usePyodide() {
  const context = useContext(PyodideContext);
  if (context === undefined) {
    throw new Error('usePyodide must be used within PyodideProvider');
  }
  return context;
}
