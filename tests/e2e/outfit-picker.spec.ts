import { expect, test, type Page } from '@playwright/test';

const outfits = [
  { id: 'classic', name: 'NOXCAT' },
  { id: 'headphones', name: '靜音耳機' },
  { id: 'beanie', name: '夜行毛帽' },
  { id: 'scarf', name: '疾風領巾' },
  { id: 'visor', name: '駭客目鏡' },
] as const;
type OutfitId = typeof outfits[number]['id'];

async function expectSoundState(page: Page, enabled: boolean) {
  const sound = page.getByTestId('sound-toggle');
  await expect(sound).toHaveAttribute('type', 'button');
  await expect(sound).toHaveAttribute('aria-label', '配樂與音效');
  await expect(sound).toHaveAttribute('aria-pressed', String(enabled));
  await expect(sound).toHaveAttribute('title', enabled ? '關閉配樂與音效' : '開啟配樂與音效');
  await expect(sound.locator('svg')).toBeVisible();
  await expect(sound.locator('.sound-waves')).toBeVisible({ visible: enabled });
  await expect(sound.locator('.sound-muted')).toBeVisible({ visible: !enabled });
}

async function expectSpeakerPosition(page: Page) {
  await expect(page.getByTestId('sound-toggle')).toBeVisible();
  const layout = await page.evaluate(() => {
    const bounds = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    return {
      screen: bounds(document.querySelector('.start-screen')!),
      speaker: bounds(document.querySelector('[data-testid="sound-toggle"]')!),
      // Header gutters intentionally overlap the button's layout area; actual
      // wordmark/text boxes must remain unobstructed.
      header: [...document.querySelectorAll('.brand-lockup .eyebrow, .brand-lockup .official-wordmark, .brand-lockup .game-title > span, .brand-lockup .tagline')]
        .map((element) => ({ name: element.className || element.tagName, ...bounds(element) })),
    };
  });
  expect(layout.speaker.width).toBeGreaterThanOrEqual(44);
  expect(layout.speaker.height).toBeGreaterThanOrEqual(44);
  expect(layout.speaker.x).toBeGreaterThanOrEqual(layout.screen.x + layout.screen.width * 0.75);
  expect(layout.speaker.y).toBeGreaterThanOrEqual(layout.screen.y);
  expect(layout.speaker.y - layout.screen.y).toBeLessThanOrEqual(88);
  expect(layout.speaker.right).toBeLessThanOrEqual(layout.screen.right + 1);
  expect(layout.screen.right - layout.speaker.right).toBeLessThanOrEqual(64);
  expect(layout.header).toHaveLength(4);
  for (const part of layout.header) {
    const overlapX = Math.min(part.right, layout.speaker.right) - Math.max(part.x, layout.speaker.x);
    const overlapY = Math.min(part.bottom, layout.speaker.bottom) - Math.max(part.y, layout.speaker.y);
    expect(overlapX <= 1 || overlapY <= 1, `Speaker must not cover ${part.name}`).toBe(true);
  }
}

async function expectSelected(page: Page, id: OutfitId) {
  const outfit = outfits.find((candidate) => candidate.id === id)!;
  await expect(page.getByTestId('outfit-preview')).toHaveAttribute('data-outfit', id);
  await expect(page.getByTestId('outfit-preview')).toHaveAttribute('aria-label', new RegExp(outfit.name));
  await expect(page.getByTestId('outfit-name')).toHaveText(outfit.name);
  await expect(page.getByTestId(`outfit-select-${id}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-testid^="outfit-select-"][aria-pressed="true"]')).toHaveCount(1);
}

async function previewGeometry(page: Page) {
  return page.getByTestId('outfit-preview').locator('svg').evaluate((element) => {
    const svg = element as SVGSVGElement;
    const part = (suffix: string) => {
      const path = svg.querySelector<SVGPathElement>(`path[id$="${suffix}"]`);
      if (!path) throw new Error(`Missing NOXCAT ${suffix} path`);
      const ancestors = [];
      for (let parent: Element | null = path.parentElement; parent && parent !== svg; parent = parent.parentElement) {
        ancestors.push({ tag: parent.tagName, transform: parent.getAttribute('transform'), cssTransform: getComputedStyle(parent).transform });
      }
      return {
        d: path.getAttribute('d'),
        transform: path.getAttribute('transform'),
        cssTransform: getComputedStyle(path).transform,
        ancestors,
        fill: getComputedStyle(path).fill.replace(/\s/g, ''),
      };
    };
    const body = part('body');
    const eyes = [part('eye-left'), part('eye-right')];
    const corePaths = new Set([body.d, ...eyes.map((eye) => eye.d)]);
    const attributes = ['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'points', 'transform'];
    // Distinct per-render IDs alone do not prove different accessory artwork.
    const geometry = [...svg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line')]
      .filter((shape) => !shape.closest('defs') && !corePaths.has(shape.getAttribute('d')))
      .map((shape) => ({ tag: shape.tagName, geometry: attributes.map((attribute) => [attribute, shape.getAttribute(attribute)]) }));
    return {
      viewBox: svg.getAttribute('viewBox'),
      core: { body, eyes },
      accessorySignature: JSON.stringify(geometry),
      accessoryShapeCount: geometry.length,
    };
  });
}

async function expectHeadphoneArch(page: Page) {
  const band = page.getByTestId('outfit-preview').locator('[data-accessory-part="headband"]');
  await expect(band).toBeVisible();
  await expect(band.locator('path')).toHaveCount(2);
  const geometry = await band.evaluate((element) => {
    const paths = [...element.querySelectorAll<SVGPathElement>('path')];
    const path = paths[0]!;
    const svg = path.ownerSVGElement!;
    const bounds = path.getBBox();
    const stroke = Number.parseFloat(getComputedStyle(path).strokeWidth);
    const length = path.getTotalLength();
    const samples = Array.from({ length: 201 }, (_, index) => {
      const point = path.getPointAtLength(length * index / 200);
      return { x: point.x, y: point.y };
    });
    const aboveEars = samples.filter(({ y }) => y < 0);
    return {
      viewBox: { y: svg.viewBox.baseVal.y, width: svg.viewBox.baseVal.width },
      d: paths.map((part) => part.getAttribute('d')),
      clipped: element.closest('[clip-path], [mask]') !== null,
      transform: element.getAttribute('transform'),
      strokes: paths.map((part) => getComputedStyle(part).stroke),
      left: bounds.x - stroke / 2,
      right: bounds.x + bounds.width + stroke / 2,
      top: bounds.y - stroke / 2,
      apex: Math.min(...samples.map(({ y }) => y)),
      upperSpan: Math.max(...aboveEars.map(({ x }) => x)) - Math.min(...aboveEars.map(({ x }) => x)),
    };
  });
  expect(geometry.d[0]).toBe(geometry.d[1]);
  expect(geometry.d[0]?.match(/m/gi)).toHaveLength(1);
  expect(geometry.clipped).toBe(false);
  expect(geometry.transform).toBeNull();
  expect(geometry.strokes.every((stroke) => stroke !== 'none')).toBe(true);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewBox.width);
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.viewBox.y);
  expect(geometry.apex).toBeLessThan(-8);
  expect(geometry.upperSpan).toBeGreaterThan(30);
}

test('all four locked accessories have distinct previews without changing NOXCAT or enabling a purchase', async ({ page }, testInfo) => {
  await page.goto('/?debug=1&demo=off');
  await expectSelected(page, 'classic');
  const annoyance = page.locator('#annoyance');
  await annoyance.fill('今天只想安靜完成工作');
  await expect(page.locator('#goggles-enabled, #sound-enabled, .accessory-toggle, .sound-row')).toHaveCount(0);
  await expectSoundState(page, true);
  await expectSpeakerPosition(page);
  await page.getByTestId('sound-toggle').click();
  await expectSoundState(page, false);
  await page.getByTestId('sound-toggle').click();
  await expectSoundState(page, true);
  await expect(annoyance).toHaveValue('今天只想安靜完成工作');
  await expect(page.getByTestId('outfit-purchase')).toBeDisabled();
  await expect(page.getByTestId('outfit-purchase')).toContainText('目前使用中');
  await expect(page.getByTestId('outfit-status')).toHaveText('已擁有・目前使用 NOXCAT');
  const classic = await previewGeometry(page);
  expect(classic.viewBox).toBe('0 0 200 182.656');
  expect(classic.core.body.d).toBeTruthy();
  expect(classic.core.body.fill).toBe('rgb(44,41,37)');
  expect(classic.core.eyes.map((eye) => eye.fill)).toEqual(['rgb(145,213,0)', 'rgb(145,213,0)']);
  const signatures = new Set([classic.accessorySignature]);
  await page.screenshot({ path: testInfo.outputPath('classic.png') });

  for (const outfit of outfits.slice(1)) {
    await page.getByTestId(`outfit-select-${outfit.id}`).click();
    await expectSelected(page, outfit.id);
    await expect(page.getByTestId('outfit-status')).toHaveText('尚未開放購買・僅供預覽，遊戲仍使用 NOXCAT');
    const purchase = page.getByTestId('outfit-purchase');
    await expect(purchase).toBeDisabled();
    await expect(purchase).toContainText('使用 NOX 幣購買');
    const appearance = await purchase.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        nativeDisabled: element instanceof HTMLButtonElement && element.disabled,
        text: style.color.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [],
        background: style.backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [],
      };
    });
    expect(appearance.nativeDisabled).toBe(true);
    for (const channels of [appearance.text, appearance.background]) {
      expect(channels).toHaveLength(3);
      expect(Math.max(...channels) - Math.min(...channels)).toBeLessThanOrEqual(30);
    }
    const preview = await previewGeometry(page);
    expect(preview.viewBox).toBe(outfit.id === 'headphones' ? '0 -24 200 206.656' : classic.viewBox);
    expect(preview.core).toEqual(classic.core);
    if (outfit.id === 'headphones') await expectHeadphoneArch(page);
    expect(preview.accessoryShapeCount).toBeGreaterThan(0);
    signatures.add(preview.accessorySignature);
    await expect(annoyance).toHaveValue('今天只想安靜完成工作');
    await page.screenshot({ path: testInfo.outputPath(`${outfit.id}.png`) });
  }
  expect(signatures.size).toBe(5);

  await page.waitForLoadState('networkidle');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const url = page.url();
  const clickEvents = await page.getByTestId('outfit-purchase').evaluate((element) => {
    let count = 0;
    const onClick = () => { count += 1; };
    element.addEventListener('click', onClick);
    (element as HTMLButtonElement).click();
    element.removeEventListener('click', onClick);
    return count;
  });
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  expect(clickEvents).toBe(0);
  expect(requests).toEqual([]);
  expect(page.url()).toBe(url);
  await expectSelected(page, 'visor');
  await expect(page.getByTestId('outfit-status')).toContainText('尚未開放購買');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByTestId('outfit-next').click();
  await expectSelected(page, 'classic');
  await expect(page.getByTestId('outfit-preview').locator('[id$="goggles"]')).toBeVisible();
  await page.getByTestId('outfit-previous').click();
  await expectSelected(page, 'visor');
  await page.getByTestId('outfit-select-classic').click();
  await expectSelected(page, 'classic');
  await expect(annoyance).toHaveValue('今天只想安靜完成工作');
});

test('outfit keyboard navigation wraps within its group and leaves annoyance editing alone', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop keyboard interaction coverage');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('sound-toggle')).toBeFocused();
  await page.keyboard.press('Space');
  await expectSoundState(page, false);
  await page.keyboard.press('Enter');
  await expectSoundState(page, true);
  await expectSelected(page, 'classic');
  const annoyance = page.locator('#annoyance');
  await annoyance.fill('保留我的煩惱文字');
  await page.getByTestId('outfit-select-classic').focus();
  for (const [key, id] of [
    ['ArrowRight', 'headphones'], ['End', 'visor'], ['ArrowRight', 'classic'],
    ['ArrowLeft', 'visor'], ['Home', 'classic'], ['End', 'visor'],
  ] as const) {
    await page.keyboard.press(key);
    await expectSelected(page, id);
    await expect(page.getByTestId(`outfit-select-${id}`)).toBeFocused();
  }
  await annoyance.focus();
  for (const key of ['Home', 'ArrowRight', 'End', 'ArrowLeft']) {
    await page.keyboard.press(key);
    await expectSelected(page, 'visor');
    await expect(annoyance).toBeFocused();
    await expect(annoyance).toHaveValue('保留我的煩惱文字');
  }
});

test('the outfit picker and start controls fit short phone viewports with 44px targets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chromium', 'Phone sizing; desktop is covered by preview interactions');
  for (const viewport of [{ width: 390, height: 844 }, { width: 390, height: 600 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByTestId('outfit-select-visor').click();
    await expectSelected(page, 'visor');
    await expectSpeakerPosition(page);
    const controls = page.locator('[data-testid="sound-toggle"], [data-testid="outfit-previous"], [data-testid="outfit-next"], [data-testid^="outfit-select-"], [data-testid="outfit-purchase"], [data-testid="generate-boss"]');
    await expect(controls).toHaveCount(10);
    const bounds = await controls.evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { id: element.getAttribute('data-testid'), x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    }));
    for (const control of bounds) {
      expect(control.width, `${control.id} at ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(44);
      expect(control.height, `${control.id} at ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(44);
      expect(control.x).toBeGreaterThanOrEqual(-1);
      expect(control.y).toBeGreaterThanOrEqual(-1);
      expect(control.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(control.bottom).toBeLessThanOrEqual(viewport.height + 1);
    }
    await expect.poll(() => page.evaluate(() => {
      const screen = document.querySelector<HTMLElement>('.screen');
      return Math.max(
        document.documentElement.scrollWidth - window.innerWidth,
        document.documentElement.scrollHeight - window.innerHeight,
        // Ignore intentionally clipped horizontal perspective-grid overscan;
        // the document and every real control must fit the viewport.
        screen ? screen.scrollHeight - screen.clientHeight : Number.POSITIVE_INFINITY,
      );
    })).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`outfits-${viewport.width}x${viewport.height}.png`) });
  }
});

test('a locked preview starts the default classic battle and retains muted sound through result and home', async ({ page }) => {
  await page.route('**/api/boss', (route) => route.abort('failed'));
  await page.goto('/?debug=1&demo=off');
  await expect(page.locator('#goggles-enabled, #sound-enabled, .accessory-toggle, .sound-row')).toHaveCount(0);
  await expectSoundState(page, true);
  await page.getByTestId('sound-toggle').click();
  await expectSoundState(page, false);
  await page.getByTestId('outfit-select-headphones').click();
  await page.getByTestId('outfit-select-classic').click();
  await expect(page.getByTestId('outfit-preview').locator('[id$="goggles"]')).toBeVisible();
  await page.getByTestId('outfit-select-visor').click();
  await expectSelected(page, 'visor');
  await expectSoundState(page, false);
  await page.locator('#annoyance').fill('不要把預覽當成已購買');
  await page.getByTestId('generate-boss').click();
  await page.getByTestId('skip-camera').click();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 8_000 });
  await page.waitForFunction(() => window.__NOXCAT_TEST__?.snapshot().state === 'DODGING');
  expect(await page.evaluate(() => window.__NOXCAT_TEST__!.visualSnapshot().goggleVisible)).toBe(true);
  await expect(page.getByTestId('outfit-preview')).toHaveCount(0);
  // Lifecycle hooks finish the round, without changing audio or equipment.
  await page.evaluate(() => {
    window.__NOXCAT_TEST__!.pauseAttacksForVisualTest();
    window.__NOXCAT_TEST__!.expireRoundForTest();
  });
  await expect(page.getByTestId('result-title')).toBeVisible({ timeout: 5_000 });
  await page.getByTestId('change-annoyance').click();
  await expectSelected(page, 'classic');
  await expectSoundState(page, false);
  await expect(page.getByTestId('outfit-preview').locator('[id$="goggles"]')).toBeVisible();
  await page.getByTestId('sound-toggle').click();
  await expectSoundState(page, true);
});
