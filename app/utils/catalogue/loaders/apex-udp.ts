/**
 * Opens an APEx algorithm that has a UDP but no studio project: fetches the
 * UDP and writes the studio code from its process graph. The code may not
 * work, so everything that doesn't match the connected backend is named for
 * the user.
 */
import { DEFAULT_EDITOR_CONFIG } from '$config/default-editor-config';
import { fetchPublic } from '$utils/api';
import { NotFound } from '$utils/errors';
import { fetchProcessIds } from '$utils/openeo/processes';
import {
  notices,
  udpCollectionIds,
  udpToPython
} from '$utils/openeo/udp-to-python';
import { formatPython } from '$utils/ruff-linter';
import { titleOf, udpHref } from '../apex/record';
import { type ApexConfig, apexRawUrl } from '../apex/repo';
import { checkCompatibility } from '../compatibility';
import type { ProjectLoader } from '../types';

// `<provider>/<algorithm>`: two folder names, so a link can't leave the catalogue.
const REF = /^[\w-][\w.-]*\/[\w-][\w.-]*$/;

async function fetchJsonFile(url: string, what: string, signal?: AbortSignal) {
  const response = await fetchPublic(url, signal);
  try {
    return await response.json();
  } catch {
    throw new NotFound(`Invalid ${what} at ${url}: not JSON`);
  }
}

/** The example arguments of an algorithm, from its first benchmark scenario. */
async function fetchScenario(url: string, signal?: AbortSignal) {
  try {
    const scenarios = await (await fetchPublic(url, signal)).json();
    const [call] = Object.values(scenarios[0].process_graph) as {
      arguments?: unknown;
    }[];
    const args = call.arguments;
    return typeof args === 'object' && args !== null
      ? (args as Record<string, unknown>)
      : {};
  } catch {
    // Not every algorithm has a scenario: the UDP defaults are used alone.
    return {};
  }
}

export function createApexUdpLoader(config: ApexConfig): ProjectLoader {
  const raw = apexRawUrl(config);

  return {
    id: 'apex-udp',
    async load(ref, { authToken, signal }) {
      if (!REF.test(ref)) {
        throw new NotFound(`Invalid APEx algorithm "${ref}"`);
      }
      const algo = ref.split('/')[1];
      const folder = `${raw}/algorithm_catalog/${ref}`;
      const recordUrl = `${folder}/records/${algo}.json`;
      const record = await fetchJsonFile(recordUrl, 'APEx record', signal);
      const href = udpHref(record);
      if (!href || !URL.canParse(href, recordUrl)) {
        throw new NotFound(`APEx algorithm "${ref}" has no UDP to open`);
      }
      const udpUrl = new URL(href, recordUrl).href;
      const [udp, scenario] = await Promise.all([
        fetchJsonFile(udpUrl, 'UDP', signal),
        fetchScenario(`${folder}/benchmark_scenarios/${algo}.json`, signal)
      ]);

      const incompatibilities: string[] = [];
      const unavailable = new Set<string>();
      for (const id of udpCollectionIds(udp)) {
        const check = await checkCompatibility(
          { collectionId: id, bands: [] },
          authToken
        );
        if (!check.compatible) unavailable.add(id);
      }

      const title = titleOf(record) ?? algo;
      let conversion;
      try {
        conversion = udpToPython(udp, { title, scenario });
      } catch (error) {
        throw new NotFound(
          `Invalid UDP at ${udpUrl}: ${(error as Error).message}`
        );
      }

      // An unavailable main collection is replaced, and named, by the
      // catalogue. The ones the code loads itself stay as the UDP has them.
      for (const id of conversion.collections) {
        if (!unavailable.has(id)) continue;
        incompatibilities.push(notices.collectionUnavailable(id));
      }
      try {
        const available = await fetchProcessIds(authToken);
        for (const process of [...conversion.processes].sort()) {
          if (available.has(process)) continue;
          incompatibilities.push(notices.processUnavailable(process));
        }
      } catch {
        incompatibilities.push(notices.processesNotChecked);
      }

      const { seed } = conversion;
      return {
        seed: {
          name: title,
          collectionId: seed.collectionId ?? DEFAULT_EDITOR_CONFIG.collectionId,
          temporalRange:
            seed.temporalRange ?? DEFAULT_EDITOR_CONFIG.temporalRange,
          propertyFilters: seed.propertyFilters,
          bands: seed.bands,
          boundingBox: seed.boundingBox,
          suggestedAlgorithm: await formatPython(conversion.code)
        },
        autoRun: false,
        generated: true,
        incompatibilities: [...incompatibilities, ...conversion.warnings]
      };
    }
  };
}
