import { test, expect } from '@playwright/test';

test.describe.serial('Sports Store Functional Verification', () => {
    // Shared Data
    const productName = `AutoTest_${Date.now()}`;
    const variantSKU = `SKU_${Date.now()}`;
    let invoiceNumber = '';

    test.beforeEach(async ({ page }) => {
        // Mock print to avoid manual interaction blocking tests
        await page.addInitScript(() => {
            window.print = () => { console.log('Print called'); };
            window.close = () => { console.log('Window close called'); };
        });
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
    });

    test('1. Login Flow (Admin)', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('text=Sign in to start billing')).toBeVisible();

        // Invalid Login
        await page.fill('input[type="text"]', 'wrong');
        await page.fill('input[type="password"]', 'wrong');
        await page.click('button[type="submit"]');
        page.on('dialog', dialog => dialog.dismiss()); // Handle alert if any

        // Valid Login
        await page.fill('input[type="text"]', 'admin');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Check Redirect to POS
        await expect(page).toHaveURL(/\/pos/);
        await expect(page.locator('text=Sports Retail POS')).toBeVisible();
    });

    test('2. Dashboard & Navigation', async ({ page }) => {
        // Assume cookie/token persisted from previous test context? 
        // Playwright defaults to new context per test unless configured. 
        // We set mode: serial, but contexts are usually fresh.
        // We need to re-login or use storageState. simpler to re-login or just do one big test file with steps.
        // I will use one big test or re-login helper. Re-login helper is safer.
        await page.goto('/login');
        await page.fill('input[type="text"]', 'admin');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/pos/);

        // Go to Dashboard
        await page.click('button:has-text("Dashboard")');
        await expect(page).toHaveURL('/dashboard');

        // Check Sections
        await expect(page.locator('text=Admin Dashboard')).toBeVisible();
        await expect(page.locator('text=Sales Overview')).toBeVisible(); // Chart
        await expect(page.locator('text=Live Inventory')).toBeVisible(); // StockTable
    });

    test('3. Product Management (Add Product)', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="text"]', 'admin');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/pos/);
        await page.goto('/dashboard');

        await page.click('button:has-text("+ Add Product")');
        await expect(page.locator('text=Add New Product')).toBeVisible();

        // Fill Form
        await page.fill('input[name="name"]', productName);
        await page.fill('textarea[name="description"]', 'Automated Test Product');
        await page.fill('input[name="gstRate"]', '12');

        // Variant Info (First row is default present)
        // Selectors are tricky, mapping index. 
        // Input placeholder="Size"
        await page.fill('input[placeholder="Size"]', 'L');
        await page.fill('input[placeholder="Color"]', 'Blue');
        await page.fill('input[placeholder="Cost"]', '500');
        await page.fill('input[placeholder="MRP"]', '1000');
        await page.fill('input[placeholder="Sell"]', '900');
        await page.fill('input[placeholder="Qty"]', '50'); // Initial Stock
        await page.fill('input[placeholder="Leave blank to auto-gen"]', variantSKU);

        // Save
        page.on('dialog', dialog => dialog.accept());
        await page.click('button:has-text("Save Product")');

        // Wait for modal to close
        await expect(page.locator('text=Add New Product')).not.toBeVisible();
    });

    test('4. Inventory Verification & Adjustment', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="text"]', 'admin');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/pos/);
        await page.goto('/dashboard');

        // Locate row in StockTable
        // Row should contain SKU or Name
        // We need to wait for table to load
        await expect(page.locator(`text=${productName}`)).toBeVisible();
        await expect(page.locator(`text=${variantSKU}`)).toBeVisible();

        // Check Stock 50
        const row = page.locator('tr', { hasText: variantSKU });
        await expect(row.locator('text=50')).toBeVisible();

        // Adjust Stock
        await row.locator('button', { hasText: 'Adjust' }).click();
        await expect(page.locator(`text=Adjust Stock: ${variantSKU}`)).toBeVisible();

        await page.fill('input[placeholder="e.g. 10 or -5"]', '10');
        await page.selectOption('select', { label: 'Received New Stock' });

        page.on('dialog', dialog => dialog.accept());
        await page.click('button:has-text("Update")');

        // Verify new stock 60
        await expect(row.locator('text=60')).toBeVisible();
    });

    test('5. POS Billing Flow', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="text"]', 'admin');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/pos/);


        // Search
        await page.fill('input[placeholder*="Scan Barcode"]', productName.substring(0, 5));
        // Wait for search
        await expect(page.locator(`text=${productName}`)).toBeVisible();

        // Add to Cart
        await page.click(`text=${productName}`);

        // Verify Cart
        await expect(page.locator('text=Total Pay')).toBeVisible(); // Check cart section
        await expect(page.locator(`table >> text=${productName}`)).toBeVisible(); // Item in cart

        // Checkout
        // We need to capture the response to get invoice number
        const salePromise = page.waitForResponse(resp => resp.url().includes('/api/v1/pos/sale') && resp.status() === 201);

        await page.click('button:has-text("Pay Now")');

        const saleResponse = await salePromise;
        const saleJson = await saleResponse.json();
        invoiceNumber = saleJson.invoiceNumber;
        console.log('Generated Invoice:', invoiceNumber);

        await expect(invoiceNumber).toBeTruthy();

        // Cart should start clearing
        await expect(page.locator(`table >> text=${productName}`)).not.toBeVisible();
    });

    test('6. Returns & Exchanges', async ({ page }) => {
        test.skip(!invoiceNumber, 'Skipping return test because invoice was not generated');

        await page.goto('/login');
        await page.fill('input[type="text"]', 'admin');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/pos/);

        await page.goto('/returns');
        await expect(page.locator('text=Returns & Exchanges')).toBeVisible();

        // Search Invoice
        await page.fill('input[placeholder*="Enter Invoice Number"]', invoiceNumber);
        await page.click('button:has-text("Find Invoice")');

        // Verify Invoice Data
        await expect(page.locator(`text=${invoiceNumber}`)).toBeVisible();
        await expect(page.locator(`text=${productName}`)).toBeVisible();

        // Select Item (first checkbox)
        await page.check('input[type="checkbox"]');

        // Enter Quantity 1 (should be default but let's confirm input availability)
        // Condition: Resellable default
        // Refund Amt needs entry? 
        // Looking at ReturnsLayout:
        // placeholder="Refund"
        await page.fill('input[placeholder="Refund"]', '800'); // Some amount

        page.on('dialog', dialog => dialog.accept());
        await page.click('button:has-text("Process Return")');

        // Should clear data
        await expect(page.locator(`text=${invoiceNumber}`)).not.toBeVisible();
    });

});
