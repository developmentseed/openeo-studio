import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useEditorStore } from '$stores/editor-store';
import { resolvePropertyFilters } from '$utils/property-filters';
import {
  readSamplePrefill,
  SAMPLE_PARAM,
  SAMPLE_URL_PARAM,
  SamplePrefillError
} from '$utils/sample-prefill';

const DEFAULT_PREFILL_NAME = 'Sample from a link';

export type PrefillState =
  | { status: 'none' }
  | { status: 'loading' }
  | {
      status: 'loaded';
      source: string;
      collectionId: string;
      bands: string[];
    }
  | { status: 'error'; message: string };

/**
 * Loads a sample from `?sample=` or `?sampleUrl=` into the editor store, as
 * a new unsaved project. It never runs the code: the user must read it and
 * click Save, which runs and saves it. The query is removed after the load, so that a reload does not
 * replace the edits of the user.
 */
export function usePrefillSample(enabled: boolean) {
  const [searchParams, setSearchParams] = useSearchParams();
  const hydrateFromScene = useEditorStore((state) => state.hydrateFromScene);
  const setSceneName = useEditorStore((state) => state.setSceneName);
  const [state, setState] = useState<PrefillState>({ status: 'none' });

  const encoded = searchParams.get(SAMPLE_PARAM);
  const url = searchParams.get(SAMPLE_URL_PARAM);

  useEffect(() => {
    if (!enabled || (!encoded && !url)) {
      // The query went away during a load (for example "New project"). Keep
      // a loaded or error state: the query is also removed after a load.
      setState((current) =>
        current.status === 'loading' ? { status: 'none' } : current
      );
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    // The same precedence as readSamplePrefill: the inline sample wins, so
    // the source of the code is never a URL that was not fetched.
    const params = new URLSearchParams();
    let source = 'the link';
    if (encoded) {
      params.set(SAMPLE_PARAM, encoded);
    } else if (url) {
      params.set(SAMPLE_URL_PARAM, url);
      source = url;
    }

    readSamplePrefill(params)
      .then((sample) => {
        if (cancelled || !sample) return;
        const name = sample.name || DEFAULT_PREFILL_NAME;
        hydrateFromScene(null, {
          name,
          collectionId: sample.collectionId,
          temporalRange: sample.temporalRange,
          // No cloudCover: no filter (Sentinel-1 and other collections
          // without `eo:cloud_cover` would return no items).
          propertyFilters: resolvePropertyFilters(sample),
          defaultBands: sample.bands,
          boundingBox: sample.boundingBox,
          suggestedAlgorithm: sample.code
        });
        // The project is not saved yet.
        setSceneName(name);
        setState({
          status: 'loaded',
          source: source === 'the link' ? source : new URL(source).host,
          collectionId: sample.collectionId,
          bands: sample.bands
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message:
            error instanceof SamplePrefillError
              ? error.message
              : 'Cannot load the sample from the link.'
        });
      })
      .finally(() => {
        if (cancelled) return;
        setSearchParams(
          (current) => {
            current.delete(SAMPLE_PARAM);
            current.delete(SAMPLE_URL_PARAM);
            return current;
          },
          { replace: true }
        );
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, encoded, url, hydrateFromScene, setSceneName, setSearchParams]);

  return {
    state,
    dismiss: () => setState({ status: 'none' })
  };
}
