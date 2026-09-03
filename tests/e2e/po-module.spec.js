import { test, expect } from '@playwright/test';

test.describe('PO Module E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    // Click on "New PO" button to navigate to PO creation page
    await page.click('text=+ New PO');
    // Wait for the form to load
    await page.waitForSelector('[data-testid="po-vendor-input"]');
  });

  test('Happy Path: Create Purchase Order successfully', async ({ page }) => {
    // Step 1: Fill in vendor name
    const vendorInput = page.locator('[data-testid="po-vendor-input"]');
    await expect(vendorInput).toBeVisible();
    await vendorInput.fill('TechSupply Inc');

    // Step 2: Select a source PR from the dropdown
    const prSelect = page.locator('[data-testid="po-source-pr-select"]');
    await expect(prSelect).toBeVisible();
    
    // Get available options to select the first one
    const options = await prSelect.locator('option').count();
    if (options > 1) {
      // Select the second option (index 1, skipping the placeholder)
      await prSelect.selectOption({ index: 1 });
      
      // Wait for the lines to load
      await page.waitForSelector('[data-testid="po-line-row"]');
    }

    // Step 3: Verify order date can be set
    const orderDateInput = page.locator('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    await orderDateInput.fill(today);

    // Step 4: Verify line items are populated
    const lineRows = page.locator('[data-testid="po-line-row"]');
    const lineCount = await lineRows.count();
    expect(lineCount).toBeGreaterThan(0);

    // Step 5: Verify allocation is valid (not over-allocated)
    const qtyInputs = page.locator('[data-testid="po-line-qty-input"]');
    const allInputsValid = true;
    for (let i = 0; i < await qtyInputs.count(); i++) {
      const input = qtyInputs.nth(i);
      const className = await input.getAttribute('class');
      expect(className).not.toContain('input-invalid');
    }

    // Step 6: Verify no allocation error is shown
    const allocationError = page.locator('[data-testid="po-allocation-error"]');
    await expect(allocationError).not.toBeVisible();

    // Step 7: Submit the form
    const submitBtn = page.locator('[data-testid="po-create-submit"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Step 8: Verify redirect to PO list page
    await page.waitForURL('/purchase-orders');
    await expect(page).toHaveURL('/purchase-orders');
    
    // Verify page title changed to list view
    const heading = page.locator('h2');
    await expect(heading).toContainText('Purchase Orders');
  });

  test('Negative Path: Over-allocation validation error', async ({ page }) => {
    // Step 1: Fill in vendor name
    const vendorInput = page.locator('[data-testid="po-vendor-input"]');
    await vendorInput.fill('OverAlloc Vendor');

    // Step 2: Select a source PR
    const prSelect = page.locator('[data-testid="po-source-pr-select"]');
    const options = await prSelect.locator('option').count();
    if (options > 1) {
      await prSelect.selectOption({ index: 1 });
      await page.waitForSelector('[data-testid="po-line-row"]');
    }

    // Step 3: Try to over-allocate by entering quantity greater than available
    const qtyInputs = page.locator('[data-testid="po-line-qty-input"]');
    
    if (await qtyInputs.count() > 0) {
      const firstQtyInput = qtyInputs.first();
      
      // Get the open quantity text from the previous cell
      const qtyOpenCell = firstQtyInput.locator('../../td:nth-child(4)');
      const qtyOpenText = await qtyOpenCell.textContent();
      const qtyOpenValue = parseFloat(qtyOpenText) || 100;
      
      // Try to order more than available (multiply by 2 to ensure over-allocation)
      const overAllocatedQty = qtyOpenValue * 2 + 10;
      await firstQtyInput.fill(String(overAllocatedQty));

      // Step 4: Verify the input is marked as invalid
      const inputClass = await firstQtyInput.getAttribute('class');
      expect(inputClass).toContain('input-invalid');

      // Step 5: Verify error message is displayed
      const allocationError = page.locator('[data-testid="po-allocation-error"]');
      await expect(allocationError).toBeVisible();
      await expect(allocationError).toContainText('Ordered quantity cannot exceed the open quantity');

      // Step 6: Verify submit button is still visible (optional to test disabling)
      const submitBtn = page.locator('[data-testid="po-create-submit"]');
      await expect(submitBtn).toBeVisible();
      
      // Step 7: Fix the over-allocation
      await firstQtyInput.fill(String(qtyOpenValue * 0.8)); // Set to 80% of available
      
      // Step 8: Verify error is cleared
      await expect(allocationError).not.toBeVisible();
      
      // Verify input is no longer marked invalid
      const fixedInputClass = await firstQtyInput.getAttribute('class');
      expect(fixedInputClass).not.toContain('input-invalid');
    }
  });

  test('Negative Path: Missing vendor name validation', async ({ page }) => {
    // Try to submit without vendor name
    const submitBtn = page.locator('[data-testid="po-create-submit"]');
    
    // Fill vendor but then clear it
    const vendorInput = page.locator('[data-testid="po-vendor-input"]');
    await vendorInput.fill('Test Vendor');
    await vendorInput.clear();

    // Select a PR to populate lines (optional, but good practice)
    const prSelect = page.locator('[data-testid="po-source-pr-select"]');
    const options = await prSelect.locator('option').count();
    if (options > 1) {
      await prSelect.selectOption({ index: 1 });
    }

    // Try to submit
    await submitBtn.click();

    // Verify error message is shown
    const errorMsg = page.locator('[data-testid="po-error"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Vendor name is required');
  });

  test('Negative Path: Cannot submit with empty lines', async ({ page }) => {
    // Fill vendor name
    const vendorInput = page.locator('[data-testid="po-vendor-input"]');
    await vendorInput.fill('EmptyLines Vendor');

    // Don't select a PR - lines will be empty
    // Try to submit with empty vendor but no PR selected
    const submitBtn = page.locator('[data-testid="po-create-submit"]');
    await submitBtn.click();

    // Verify error message about insufficient data
    const errorMsg = page.locator('[data-testid="po-error"]');
    await expect(errorMsg).toBeVisible();
  });

  test('Happy Path: Add and remove lines', async ({ page }) => {
    // Fill vendor name
    const vendorInput = page.locator('[data-testid="po-vendor-input"]');
    await vendorInput.fill('LineManagement Vendor');

    // Select a PR to get initial lines
    const prSelect = page.locator('[data-testid="po-source-pr-select"]');
    const options = await prSelect.locator('option').count();
    if (options > 1) {
      await prSelect.selectOption({ index: 1 });
      await page.waitForSelector('[data-testid="po-line-row"]');
    }

    // Get initial line count
    let lineRows = page.locator('[data-testid="po-line-row"]');
    const initialLineCount = await lineRows.count();

    // Add a new line
    const addLineBtn = page.locator('button:has-text("+ New Line")');
    if (await addLineBtn.isVisible()) {
      await addLineBtn.click();
      await page.waitForTimeout(300); // Brief wait for DOM update
      
      // Verify line was added
      lineRows = page.locator('[data-testid="po-line-row"]');
      const newLineCount = await lineRows.count();
      expect(newLineCount).toBe(initialLineCount + 1);
    }

    // Fill in the new line's item code
    const itemCodeInputs = page.locator('input[placeholder="Type..."]').filter({ hasText: '' });
    if (await itemCodeInputs.count() > 0) {
      const lastItemCodeInput = itemCodeInputs.last();
      await lastItemCodeInput.fill('NEW-ITEM-001');
    }

    // Verify we can remove the last line if there are multiple
    lineRows = page.locator('[data-testid="po-line-row"]');
    const finalLineCount = await lineRows.count();
    if (finalLineCount > 1) {
      const deleteButtons = page.locator('button.btn-danger-icon');
      const lastDeleteBtn = deleteButtons.last();
      await lastDeleteBtn.click();
      await page.waitForTimeout(300);

      // Verify line was removed
      lineRows = page.locator('[data-testid="po-line-row"]');
      const afterDeleteCount = await lineRows.count();
      expect(afterDeleteCount).toBe(finalLineCount - 1);
    }
  });
});
