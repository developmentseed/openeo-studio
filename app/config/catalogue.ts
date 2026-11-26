/**
 * The active catalogue sources and loaders. A deployment picks its sources
 * by editing these lists.
 */
import { createCatalogue } from '$utils/catalogue/catalogue';
import { encodedUrlLoader } from '$utils/catalogue/loaders/encoded-url';
import { projectUrlLoader } from '$utils/catalogue/loaders/project-url';
import { createApexSource } from '$utils/catalogue/sources/apex';
import { createApexUdpLoader } from '$utils/catalogue/loaders/apex-udp';
import { createApexUdpSource } from '$utils/catalogue/sources/apex-udp';
import { samplesLoader, samplesSource } from '$utils/catalogue/sources/samples';
import { savedProjectLoader } from '$utils/catalogue/loaders/saved-project';

export const APEX_CONFIG = {
  owner: 'ESA-APEx',
  repo: 'apex_algorithms',
  ref: 'daniel/openeo-studio-projects-2'
};

export const catalogue = createCatalogue({
  sources: [
    samplesSource,
    createApexSource(APEX_CONFIG),
    createApexUdpSource(APEX_CONFIG)
  ],
  loaders: [
    samplesLoader,
    projectUrlLoader,
    createApexUdpLoader(APEX_CONFIG),
    encodedUrlLoader,
    savedProjectLoader
  ]
});
