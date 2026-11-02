import { appConfig } from './runtime';
import { resolveBaseLayers } from './basemaps';

export const APP_TITLE = appConfig.appTitle;

export const BASE_LAYERS = resolveBaseLayers({
  basemaps: appConfig.basemaps,
  maptilerKey: appConfig.maptilerKey,
  onInvalid: (reason) =>
    // eslint-disable-next-line no-console
    console.warn(`BASEMAPS setting ignored: ${reason}`)
});

export const ENABLE_NARRATIVE_EXPORT = appConfig.enableNarrativeExport;
