const { test, expect } = require('@playwright/test');

const PAGE = 'gear-calculator.html';

test.describe('URL hash state', () => {
  test('page loads with default values when no hash', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#wheelCirc')).toHaveValue('2109');
    await expect(page.locator('#rolloutLimit')).toHaveValue('6.73');
    await expect(page.locator('#cadence')).toHaveValue('90');
    await expect(page.locator('#excludeHighAngle')).toBeChecked();
  });

  test('loadFromHash populates inputs from URL hash', async ({ page }) => {
    await page.goto(PAGE + '#wc=2000&rl=7.18&cd=100&eh=0&dm=speed');
    await expect(page.locator('#wheelCirc')).toHaveValue('2000');
    await expect(page.locator('#rolloutLimit')).toHaveValue('7.18');
    await expect(page.locator('#cadence')).toHaveValue('100');
    await expect(page.locator('#excludeHighAngle')).not.toBeChecked();
    await expect(page.locator('#displayMetric')).toHaveValue('speed');
  });

  test('loadFromHash handles partial hash (missing keys keep defaults)', async ({ page }) => {
    await page.goto(PAGE + '#wc=1900&cd=110');
    await expect(page.locator('#wheelCirc')).toHaveValue('1900');
    await expect(page.locator('#cadence')).toHaveValue('110');
    // defaults preserved
    await expect(page.locator('#rolloutLimit')).toHaveValue('6.73');
    await expect(page.locator('#maxBlock')).toHaveValue('3');
    await expect(page.locator('#excludeHighAngle')).toBeChecked();
  });

  test('loadFromHash handles comma-separated lists', async ({ page }) => {
    await page.goto(PAGE + '#cr=34,36,38&cs=11,13,15,17');
    await expect(page.locator('#chainrings')).toHaveValue('34,36,38');
    await expect(page.locator('#cassette')).toHaveValue('11,13,15,17');
  });

  test('loadFromHash handles all advanced settings', async ({ page }) => {
    await page.goto(PAGE + '#cl=420&ci=42&co=47&ho=135&lc=4&cp=4.0&aw=2.0&ad=3.0');
    await expect(page.locator('#chainstay')).toHaveValue('420');
    await expect(page.locator('#chainlineInner')).toHaveValue('42');
    await expect(page.locator('#chainlineOuter')).toHaveValue('47');
    await expect(page.locator('#hubOLD')).toHaveValue('135');
    await expect(page.locator('#locknutToCog')).toHaveValue('4');
    await expect(page.locator('#cogPitch')).toHaveValue('4.0');
    await expect(page.locator('#angleWarn')).toHaveValue('2.0');
    await expect(page.locator('#angleDanger')).toHaveValue('3.0');
  });

  test('share button updates hash and shows confirmation', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PAGE);

    // Change a value first
    await page.locator('#wheelCirc').fill('2000');
    await page.locator('#shareBtn').click();

    // Hash should be set
    const url = page.url();
    expect(url).toContain('#');
    expect(url).toContain('wc=2000');

    // Button should show confirmation
    await expect(page.locator('#shareBtn')).toHaveText('Copied to clipboard!');

    // Button should revert after 2 seconds
    await expect(page.locator('#shareBtn')).toHaveText('Share', { timeout: 3000 });
  });

  test('save button updates hash and shows bookmark hint', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#saveBtn').click();

    // Hash should be set
    const url = page.url();
    expect(url).toContain('#');
    expect(url).toContain('wc=2109');

    // Button should show bookmark hint
    const btnText = await page.locator('#saveBtn').textContent();
    expect(btnText).toContain('Bookmark this page');
    expect(btnText).toMatch(/[⌘D|Ctrl\+D]/);

    // Button should revert after 3 seconds
    await expect(page.locator('#saveBtn')).toHaveText('Save', { timeout: 4000 });
  });

  test('serialized hash strips spaces from comma-separated lists', async ({ page }) => {
    await page.goto(PAGE);
    // Default chainrings have spaces: "34, 36, 38, ..."
    await page.locator('#shareBtn').click();
    const url = page.url();
    // Should not contain encoded spaces
    expect(url).not.toContain('%20');
    // Should contain compact comma-separated values
    expect(url).toContain('cr=34%2C36%2C38');
  });

  test('round-trip: serialize then load preserves all values', async ({ page }) => {
    await page.goto(PAGE);

    // Set custom values
    await page.locator('#wheelCirc').fill('2050');
    await page.locator('#rolloutLimit').fill('7.18');
    await page.locator('#cadence').fill('95');
    await page.locator('#maxBlock').fill('2');
    await page.locator('#excludeHighAngle').uncheck();

    // Serialize
    await page.locator('#shareBtn').click();
    const hashUrl = page.url();

    // Navigate to the serialized URL (fresh load)
    await page.goto(hashUrl);

    // Verify all values restored
    await expect(page.locator('#wheelCirc')).toHaveValue('2050');
    await expect(page.locator('#rolloutLimit')).toHaveValue('7.18');
    await expect(page.locator('#cadence')).toHaveValue('95');
    await expect(page.locator('#maxBlock')).toHaveValue('2');
    await expect(page.locator('#excludeHighAngle')).not.toBeChecked();
  });
});

test.describe('Page title', () => {
  test('default title includes chainring, cassette range, and Youth B', async ({ page }) => {
    await page.goto(PAGE);
    const title = await page.title();
    expect(title).toContain('Youth Bike Gear Calculator');
    expect(title).toContain('11-28');
    expect(title).toContain('Youth B');
  });

  test('title updates when rollout limit matches Youth A', async ({ page }) => {
    await page.goto(PAGE + '#rl=7.18');
    const title = await page.title();
    expect(title).toContain('Youth A');
  });

  test('title updates when rollout limit matches Youth C', async ({ page }) => {
    await page.goto(PAGE + '#rl=6.34');
    const title = await page.title();
    expect(title).toContain('Youth C');
  });

  test('title shows raw limit when not matching a preset', async ({ page }) => {
    await page.goto(PAGE + '#rl=6.50');
    const title = await page.title();
    expect(title).toContain('6.5m');
  });

  test('title reflects cassette range from hash', async ({ page }) => {
    await page.goto(PAGE + '#cs=12,14,16,18,20');
    const title = await page.title();
    expect(title).toContain('12-20');
  });
});
