import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useEditorStore } from '$stores/editor-store';
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
 * click Run. The query is removed after the load, so that a reload does not
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
    if (!enabled || (!encoded && !url)) return;

    let cancelled = false;
    setState({ status: 'loading' });

    const params = new URLSearchParams();
    if (encoded) params.set(SAMPLE_PARAM, encoded);
    else if (url) params.set(SAMPLE_URL_PARAM, url);

    readSamplePrefill(params)
      .then((sample) => {
        if (cancelled || !sample) return;
        const name = sample.name || DEFAULT_PREFILL_NAME;
        hydrateFromScene(null, {
          name,
          collectionId: sample.collectionId,
          temporalRange: sample.temporalRange,
          cloudCover: sample.cloudCover ?? 100,
          defaultBands: sample.bands,
          boundingBox: sample.boundingBox,
          suggestedAlgorithm: sample.code
        });
        // The project is not saved yet.
        setSceneName(name);
        setState({
          status: 'loaded',
          source: url ? new URL(url).host : 'the link',
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
