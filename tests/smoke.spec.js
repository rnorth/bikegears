const { test, expect } = require('@playwright/test');

const PAGE = 'gear-calculator.html';

test.describe('Page load and initial state', () => {
  test('page loads with heading and disclaimer', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h1')).toHaveText('Youth Bike Gear Calculator');
    await expect(page.locator('.disclaimer')).toBeVisible();
  });

  test('ranking table is populated on load', async ({ page }) => {
    await page.goto(PAGE);
    const rows = page.locator('#rankingBody tr');
    await expect(rows.first()).toBeVisible();
    // With default inputs there should be multiple configurations
    expect(await rows.count()).toBeGreaterThan(3);
  });

  test('first configuration is auto-selected and detail panel shown', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#detailPanel')).toBeVisible();
    await expect(page.locator('#rankingBody tr.selected')).toHaveCount(1);
  });

  test('metric cards are shown with values', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('.metric-card');
    expect(await cards.count()).toBe(6);
    // Max Rollout card should contain 'm'
    await expect(cards.first()).toContainText('m');
  });
});

test.describe('Ranking table', () => {
  test('rankings are sorted by gap ascending (best first)', async ({ page }) => {
    await page.goto(PAGE);
    const gapCells = page.locator('#rankingBody tr td:nth-child(6)');
    const count = await gapCells.count();
    const gaps = [];
    for (let i = 0; i < count; i++) {
      const text = await gapCells.nth(i).textContent();
      gaps.push(parseFloat(text));
    }
    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i]).toBeGreaterThanOrEqual(gaps[i - 1]);
    }
  });

  test('all max rollouts are within the limit', async ({ page }) => {
    await page.goto(PAGE);
    const rolloutCells = page.locator('#rankingBody tr td:nth-child(5)');
    const count = await rolloutCells.count();
    for (let i = 0; i < count; i++) {
      const text = await rolloutCells.nth(i).textContent();
      const rollout = parseFloat(text);
      expect(rollout).toBeLessThanOrEqual(6.73);
    }
  });

  test('clicking a row selects it and updates detail panel', async ({ page }) => {
    await page.goto(PAGE);
    const secondRow = page.locator('#rankingBody tr').nth(1);
    const chainringText = await secondRow.locator('td:nth-child(2)').textContent();
    await secondRow.click();

    await expect(secondRow).toHaveClass(/selected/);
    // Detail title should reference the selected chainring
    await expect(page.locator('#detailTitle')).toContainText(chainringText.trim().replace('T', ''));
  });
});

test.describe('Gear table', () => {
  test('gear table has correct structure', async ({ page }) => {
    await page.goto(PAGE);
    // Header row should have cog columns
    const headers = page.locator('#gearTable thead th');
    expect(await headers.count()).toBeGreaterThan(5);
    // First header is "Ring \ Cog"
    await expect(headers.first()).toContainText('Ring');

    // Body should have 1-2 rows (outer ring, possibly inner)
    const bodyRows = page.locator('#gearTable tbody tr');
    const rowCount = await bodyRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    expect(rowCount).toBeLessThanOrEqual(2);
  });

  test('gear cells show rollout values by default', async ({ page }) => {
    await page.goto(PAGE);
    // The gear cells should contain decimal numbers (rollout in metres)
    const firstCell = page.locator('#gearTable tbody .gear-cell .rollout').first();
    const text = await firstCell.textContent();
    expect(parseFloat(text)).toBeGreaterThan(0);
  });

  test('blocked cogs are marked with blocked class', async ({ page }) => {
    // Use a config that requires blocking — set a small chainring with tight limit
    await page.goto(PAGE + '#cr=50&cs=11,12,13,14,15,17,19,21,24,28&rl=6.73&mb=3');
    // Click the first config that has blocking
    const rows = page.locator('#rankingBody tr');
    const count = await rows.count();
    let foundBlocked = false;
    for (let i = 0; i < count; i++) {
      const blockText = await rows.nth(i).locator('td:nth-child(3)').textContent();
      if (blockText.trim() !== 'None') {
        await rows.nth(i).click();
        foundBlocked = true;
        break;
      }
    }
    if (foundBlocked) {
      await expect(page.locator('#gearTable .gear-cell.blocked').first()).toBeVisible();
    }
  });

  test('max gear cell is highlighted', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#gearTable .gear-cell.max-gear')).toHaveCount(1);
  });
});

test.describe('Speed chart', () => {
  test('speed chart renders bars', async ({ page }) => {
    await page.goto(PAGE);
    const bars = page.locator('#speedChart .speed-bar');
    expect(await bars.count()).toBeGreaterThan(5);
  });

  test('speed bars have numeric labels', async ({ page }) => {
    await page.goto(PAGE);
    const labels = page.locator('#speedChart .speed-bar-value');
    const first = await labels.first().textContent();
    expect(parseInt(first)).toBeGreaterThan(0);
  });

  test('cadence label matches input', async ({ page }) => {
    await page.goto(PAGE + '#cd=100');
    await expect(page.locator('#cadenceLabel')).toHaveText('100');
  });
});

test.describe('Preset buttons', () => {
  test('wheel preset updates value and recalculates', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('button:has-text("700×23")').click();
    await expect(page.locator('#wheelCirc')).toHaveValue('2096');
    // Ranking should still be populated
    await expect(page.locator('#rankingBody tr').first()).toBeVisible();
  });

  test('cassette preset updates value', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('button:has-text("11-25")').click();
    await expect(page.locator('#cassette')).toHaveValue('11,12,13,14,15,17,19,21,23,25');
  });

  test('chainring preset updates value', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('button:has-text("50/34")').click();
    await expect(page.locator('#chainrings')).toHaveValue('34,50');
  });

  test('rollout limit preset updates value', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('button:has-text("Youth A")').click();
    await expect(page.locator('#rolloutLimit')).toHaveValue('7.18');
  });

  test('active preset is highlighted', async ({ page }) => {
    await page.goto(PAGE);
    // Default wheel is 2109 = 700×25
    await expect(page.locator('button[data-preset="2109"]')).toHaveClass(/active/);
    // Click a different preset
    await page.locator('button[data-preset="2096"]').click();
    await expect(page.locator('button[data-preset="2096"]')).toHaveClass(/active/);
    await expect(page.locator('button[data-preset="2109"]')).not.toHaveClass(/active/);
  });
});

test.describe('Display metric selector', () => {
  test('changing to speed shows speed values in gear table', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#displayMetric').selectOption('speed');
    // Wait for debounced recalc
    await page.waitForTimeout(200);
    await expect(page.locator('#gearTableMetricLabel')).toContainText('Speed');
  });

  test('changing to gear ratio shows ratio values', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#displayMetric').selectOption('ratio');
    await page.waitForTimeout(200);
    await expect(page.locator('#gearTableMetricLabel')).toContainText('Gear Ratio');
  });

  test('changing to gear inches shows inches values', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#displayMetric').selectOption('inches');
    await page.waitForTimeout(200);
    await expect(page.locator('#gearTableMetricLabel')).toContainText('Gear Inches');
  });
});

test.describe('Rollout calculations', () => {
  test('known rollout: 50T chainring / 11T cog / 2109mm wheel = 9.586m', async ({ page }) => {
    // 50/11 * 2.109 = 9.586... — raise limit to 10 so it appears in ranking
    await page.goto(PAGE + '#cr=50&cs=11,28&mb=0&rl=10');
    const rolloutCell = page.locator('#rankingBody tr').first().locator('td:nth-child(5)');
    const text = await rolloutCell.textContent();
    expect(parseFloat(text)).toBeCloseTo(9.586, 1);
  });

  test('known rollout: 34T chainring / 28T cog / 2109mm wheel = 2.561m', async ({ page }) => {
    await page.goto(PAGE + '#cr=34&cs=28&mb=0&rl=10');
    const rolloutCell = page.locator('#rankingBody tr').first().locator('td:nth-child(5)');
    const text = await rolloutCell.textContent();
    // 34/28 * 2.109 = 2.5609...
    expect(parseFloat(text)).toBeCloseTo(2.561, 1);
  });
});

test.describe('Input changes trigger recalculation', () => {
  test('changing wheel circumference updates rankings', async ({ page }) => {
    await page.goto(PAGE);
    const initialRollout = await page.locator('#rankingBody tr.selected td:nth-child(5)').textContent();

    await page.locator('#wheelCirc').fill('1800');
    // Wait for debounced recalc
    await page.waitForTimeout(200);

    const updatedRollout = await page.locator('#rankingBody tr.selected td:nth-child(5)').textContent();
    expect(updatedRollout).not.toBe(initialRollout);
  });

  test('changing max block affects available configurations', async ({ page }) => {
    await page.goto(PAGE + '#mb=0');
    await page.waitForTimeout(200);
    const countNoBlock = await page.locator('#rankingBody tr').count();

    await page.locator('#maxBlock').fill('5');
    await page.waitForTimeout(200);
    const countWithBlock = await page.locator('#rankingBody tr').count();

    // More blocking options means potentially more configs that fit under the limit
    expect(countWithBlock).toBeGreaterThanOrEqual(countNoBlock);
  });
});

test.describe('Chain angle indicators', () => {
  test('gear cells have chain angle classes', async ({ page }) => {
    await page.goto(PAGE);
    // At least some cells should have angle-green
    await expect(page.locator('#gearTable .gear-cell.angle-green').first()).toBeVisible();
  });

  test('chain angle values shown as detail text', async ({ page }) => {
    await page.goto(PAGE);
    const detail = page.locator('#gearTable .gear-cell .detail').first();
    const text = await detail.textContent();
    // Should end with degree symbol
    expect(text).toMatch(/[\d.]+°/);
  });
});

test.describe('excludeHighAngle on auto-select', () => {
  test('legal gears count excludes high-angle gears on initial load', async ({ page }) => {
    // Setup: wide cassette with extreme chain angles on small cogs.
    // Use a short chainstay and wide hub to exaggerate angles.
    // With excludeHighAngle checked (default), the legal gears count on
    // auto-select (initial load) should match what you get after clicking the same row.
    await page.goto(PAGE + '#cr=50&cs=11,12,13,14,15,17,19,21,24,28&rl=10&mb=0&cl=300&ci=35&co=55&ad=1.5&eh=1');

    // Get legal gears count from auto-selected detail on initial load
    const legalGearsCard = page.locator('.metric-card:has(.label:text("Legal Gears")) .value');
    const autoSelectCount = await legalGearsCard.textContent();

    // Now click the same selected row to trigger the manual-click code path
    await page.locator('#rankingBody tr.selected').click();
    const manualClickCount = await legalGearsCard.textContent();

    // These should be identical — the bug causes autoSelectCount to be higher
    // because excludeHighAngle is not passed on auto-select
    expect(autoSelectCount).toBe(manualClickCount);
  });
});

test.describe('Detail subtitle with blocked and angle-excluded cogs', () => {
  test('cog exceeding rollout limit is physically blocked even when angle-excluded', async ({ page }) => {
    // 38T chainring, 11T cog: rollout = 38/11 * 2.110 = 7.29m > 6.73m limit
    // 11T also has chain angle ~2.86° > 2.5° danger threshold
    // With eh=1, 11T must still be physically blocked (not just angle-excluded)
    await page.goto(PAGE + '#wc=2110&rl=6.73&mb=3&cr=38%2C50&cs=11%2C12%2C13%2C14%2C15%2C17%2C19%2C21%2C23%2C25&cd=90&dm=rollout&aw=1.5&ad=2.5&eh=1&cl=410&ci=41&co=46&ho=130&lc=3.5&cp=3.95');

    const subtitle = page.locator('#detailSubtitle');
    const text = await subtitle.textContent();

    // Should say 11T is blocked (physically), not just angle-excluded
    expect(text).toMatch(/[Bb]lock/);
    expect(text).toContain('11T');
    expect(text).toContain('12T');
  });

  test('subtitle mentions angle-excluded cogs that are within rollout limit', async ({ page }) => {
    // Use a config where a cog is within rollout limit but has bad chain angle
    // 34T/11T with 2110mm wheel = 6.52m (under 7.18 limit), but angle ~2.86° > 2.5°
    await page.goto(PAGE + '#wc=2110&rl=7.18&mb=3&cr=34%2C50&cs=11%2C12%2C13%2C14%2C15%2C17%2C19%2C21%2C23%2C25&cd=90&dm=rollout&aw=1.5&ad=2.5&eh=1&cl=410&ci=41&co=46&ho=130&lc=3.5&cp=3.95');

    const subtitle = page.locator('#detailSubtitle');
    const text = await subtitle.textContent();

    // 11T is within rollout limit but angle-excluded — should mention angle exclusion
    expect(text).toContain('chain angle');
    expect(text).toContain('11T');
    expect(text).not.toMatch(/[Bb]lock/);
  });
});

test.describe('Edge cases', () => {
  test('empty chainrings input does not crash', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#chainrings').fill('');
    await page.waitForTimeout(200);
    // Page should not error — ranking body just empty
    await expect(page.locator('h1')).toBeVisible();
  });

  test('empty cassette input does not crash', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#cassette').fill('');
    await page.waitForTimeout(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('single chainring and single cog works', async ({ page }) => {
    await page.goto(PAGE + '#cr=42&cs=16&rl=10&mb=0');
    const rows = page.locator('#rankingBody tr');
    expect(await rows.count()).toBe(1);
  });
});
