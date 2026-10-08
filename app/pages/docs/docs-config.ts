import overview from './content/overview.md?raw';
import docs from './content/docs.md?raw';

export interface DocPage {
  /** Url segment under /docs. The first page is served at /docs. */
  id: string;
  title: string;
  content: string;
}

export const DOC_PAGES: DocPage[] = [
  { id: 'overview', title: 'Overview', content: overview },
  { id: 'docs', title: 'Docs', content: docs }
];

export function getDocPath(doc: DocPage) {
  return doc === DOC_PAGES[0] ? '/docs' : `/docs/${doc.id}`;
}

export function findDocPage(docId?: string) {
  return docId ? DOC_PAGES.find((doc) => doc.id === docId) : DOC_PAGES[0];
}
