import { test, expect } from '@playwright/test';

test.describe('PO Create Page - Table Data Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/purchase-orders/create', {
      waitUntil: 'networkidle',
    });
  });

  test('should display table with empty row on page load', async ({ page }) => {
    // Wait for the table to be visible
    await page.waitForSelector('table', { timeout: 5000 });

    // Check table header exists
    const tableHeader = await page.$('thead');
    expect(tableHeader).not.toBeNull();

    // Check if thead has columns
    const headers = await page.$$('thead th');
    console.log('Number of columns in header:', headers.length);
    expect(headers.length).toBe(12); // Should have 12 column headers

    // Check if tbody exists and has at least one row
    const rows = await page.$$('tbody tr');
    console.log('Number of rows in table:', rows.length);
    expect(rows.length).toBeGreaterThan(0);

    // Check first row has cells
    if (rows.length > 0) {
      const cells = await page.$$eval('tbody tr:first-child td', (tds) => tds.length);
      console.log('Number of cells in first row:', cells);
      expect(cells).toBe(12);
    }

    // Take screenshot to see what's displayed
    await page.screenshot({ path: '/tmp/po-create-page.png', fullPage: true });
    console.log('Screenshot saved to /tmp/po-create-page.png');
  });

  test('should select a PR and load lines', async ({ page }) => {
    // Wait for select dropdown
    const prSelect = await page.$('[data-testid="po-source-pr-select"]');
    expect(prSelect).not.toBeNull();

    // Get available options
    const options = await page.$$eval('select option', (opts) =>
      opts.map((o) => ({ text: o.textContent, value: o.value }))
    );
    console.log('Available PR options:', options);

    // If there are approved requisitions, select the first one
    if (options.length > 1) {
      const firstPrValue = options[1].value; // Skip the "Select..." option
      await page.selectOption('[data-testid="po-source-pr-select"]', firstPrValue);

      // Wait for lines to load
      await page.waitForTimeout(1000);

      // Check if rows appeared
      const rows = await page.$$('tbody tr');
      console.log('Number of rows after PR selection:', rows.length);

      // Take screenshot
      await page.screenshot({ path: '/tmp/po-create-page-with-pr.png', fullPage: true });
      console.log('Screenshot saved to /tmp/po-create-page-with-pr.png');
    } else {
      console.log('No approved requisitions available to test');
    }
  });

  test('should display table structure with CSS applied', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table', { timeout: 5000 });

    // Check if table-wrapper has correct styles
    const tableWrapper = await page.$('.table-wrapper');
    const styles = await tableWrapper.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        overflow: computed.overflowX,
        border: computed.border,
        borderRadius: computed.borderRadius,
      };
    });
    console.log('Table wrapper styles:', styles);

    // Check first row visibility
    const firstRow = await page.$('tbody tr:first-child');
    if (firstRow) {
      const rowStyles = await firstRow.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          height: computed.height,
        };
      });
      console.log('First row styles:', rowStyles);
    }
  });
});
