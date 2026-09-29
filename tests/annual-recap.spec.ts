import { test, expect } from '@playwright/test';

test.use({ channel: 'chrome', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

test('annual recap: all stories, backgrounds, navigation and focus restoration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const entry = page.locator('.recap-entry');
  await entry.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.recap-copy h2')).toHaveText('Год Джеки');
  await expect(page.getByRole('button', { name: 'Начать', exact: true })).toHaveCount(0);
  for (let i = 1; i <= 13; i++) {
    await page.getByRole('button', { name: `История ${i}:`, exact: false }).click();
    await expect(page.locator('.recap-copy p')).not.toBeEmpty();
    await expect(page.locator('.recap-progress [aria-current="step"]')).toHaveAttribute('aria-label', new RegExp(`^История ${i}:`));
    if (i >= 3) {
      await expect(page.locator('.recap-background')).toHaveAttribute('src', `/assets/recap/${i}.jpg`);
      await expect.poll(() => page.locator('.recap-background').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    const fits = await page.locator('.recap-copy').evaluate(el => el.getBoundingClientRect().bottom < window.innerHeight - 80);
    expect(fits).toBe(true);
  }
  await page.getByRole('button', { name: 'Предыдущая история', exact: true }).click();
  await expect(page.locator('.recap-copy h2')).toHaveText('Любимое время года');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.recap-copy h2')).toHaveText('Стал выносливее');
  await page.getByRole('button', { name: 'Завершить итоги' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(entry).toBeFocused();
  await entry.click();
  await expect(page.locator('.recap-copy h2')).toHaveText('Год Джеки');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('small screen fits long copy and pause works', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.locator('.recap-entry').click();
  await page.getByRole('button', { name: 'Приостановить итоги' }).click();
  await expect(page.getByRole('button', { name: 'Продолжить итоги' })).toBeVisible();
  for (const i of [3, 7, 10, 13]) {
    await page.getByRole('button', { name: `История ${i}:`, exact: false }).click();
    await expect(page.locator('.recap-view')).toHaveClass(new RegExp(`recap-at-${i} `));
    await page.waitForTimeout(200);
    expect(await page.locator('.recap-copy').evaluate(el => el.getBoundingClientRect().bottom < window.innerHeight - 70)).toBe(true);
  }
});

test('autoplay advances and pauses on demand', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('.recap-entry').click();
  await expect(page.locator('.recap-copy h2')).toHaveText('Вокруг света почти получилось', { timeout: 9000 });
  await page.getByRole('button', { name: 'Приостановить итоги' }).click();
  const progress = page.locator('.recap-progress [aria-current] span');
  const before = await progress.getAttribute('style');
  await page.waitForTimeout(500);
  expect(await progress.getAttribute('style')).toBe(before);
  await page.getByRole('button', { name: 'Продолжить итоги' }).click();
  await expect.poll(() => progress.getAttribute('style')).not.toBe(before);
});
