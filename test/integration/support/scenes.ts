import type { Page } from '@playwright/test';

export const SCENE_IDS = {
  ADRIATIC: 'sentinel-2-adriatic',
  CUMBRE_VIEJA: 'sentinel-2-cumbre-vieja',
  NDCI: 'sentinel-2-ndci'
} as const;

export type SceneId = (typeof SCENE_IDS)[keyof typeof SCENE_IDS];

export function sceneEditorPath(sceneId: SceneId): string {
  return `/editor/${sceneId}`;
}

export async function gotoSceneOrFail(
  page: Page,
  sceneId: SceneId
): Promise<void> {
  const targetPath = sceneEditorPath(sceneId);

  await page.goto('/');

  const availableScenePaths = await page
    .locator('a[href^="/editor/"]')
    .evaluateAll((elements) => {
      const hrefs = elements
        .map((element) => element.getAttribute('href'))
        .filter((href): href is string => Boolean(href));
      return Array.from(new Set(hrefs));
    });

  if (!availableScenePaths.includes(targetPath)) {
    const availableSceneIds = availableScenePaths
      .map((path) => path.replace('/editor/', ''))
      .sort();

    throw new Error(
      `Scene id "${sceneId}" does not exist in landing page scene links. ` +
        `Available scene ids: ${availableSceneIds.join(', ') || '(none found)'}`
    );
  }

  await page.goto(targetPath);
  await page.waitForURL(targetPath);
}
