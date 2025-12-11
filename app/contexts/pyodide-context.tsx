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
  // Load Pyodide runtime from CDN (matching local package version)
  onLog(createLogEntry('Loading Pyodide runtime...'));
  const pyodideInstance = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`
  });
  onLog(createLogEntry('Pyodide loaded successfully', 'success'));

  // Install OpenEO package
  onLog(createLogEntry('Installing openeo package...'));
  await pyodideInstance.loadPackage('micropip');
  const micropip = pyodideInstance.pyimport('micropip');
  await micropip.install('openeo');
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
