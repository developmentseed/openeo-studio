import { entryHref, linkFromParams } from '$utils/catalogue/links';

const RAW = 'https://raw.example/a b/project.json';

describe('entryHref', () => {
  it('links a sample by id', () => {
    expect(entryHref({ loader: 'samples', ref: 'sentinel-2-apa' })).toBe(
      '/editor?sample_id=sentinel-2-apa'
    );
  });

  it('links a project file by its encoded URL', () => {
    const href = entryHref({ loader: 'project-url', ref: RAW });
    expect(new URL(href!, 'http://x').searchParams.get('project_url')).toBe(
      RAW
    );
  });

  it('has no link for a loader without a param', () => {
    expect(entryHref({ loader: 'saved-project', ref: 'p1' })).toBeUndefined();
  });
});

describe('linkFromParams', () => {
  it('reads each link param back', () => {
    expect(linkFromParams(new URLSearchParams('sample_id=s1'))).toEqual({
      loader: 'samples',
      ref: 's1'
    });
    expect(linkFromParams(new URLSearchParams({ project_url: RAW }))).toEqual({
      loader: 'project-url',
      ref: RAW
    });
    expect(linkFromParams(new URLSearchParams('prefill=abc'))).toEqual({
      loader: 'encoded-url',
      ref: 'abc'
    });
  });

  it('round-trips with entryHref', () => {
    const open = { loader: 'project-url', ref: RAW };
    const href = entryHref(open)!;
    expect(linkFromParams(new URL(href, 'http://x').searchParams)).toEqual(
      open
    );
  });

  it('returns null without a link param', () => {
    expect(linkFromParams(new URLSearchParams('other=1'))).toBeNull();
    expect(linkFromParams(new URLSearchParams('sample_id='))).toBeNull();
  });
});
