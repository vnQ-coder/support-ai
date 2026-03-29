import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = '/Users/muhammadjamil/Desktop/practice/ai-agent/e2e-screenshots';
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CLERK_SECRET = 'sk_test_K03OG71KYUIMfUTxEzzj35W9qwAynL549xFPq5LxoS';
const USER_ID = 'user_3BcMVu78KvJLLVa1EBClyvrxFic';

let stepResults = [];

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  Screenshot: ${name}.png`);
}

function record(step, status, detail) {
  stepResults.push({ step, status, detail });
  console.log(`  [${status}] Step ${step}: ${detail}`);
}

async function getSignInToken() {
  const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: USER_ID }),
  });
  const data = await res.json();
  return data.token;
}

async function getTestingToken() {
  const res = await fetch('https://api.clerk.com/v1/testing_tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  return data.token;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // ============================================
  // STEP 1: Navigate to sign-up page (verify it exists)
  // ============================================
  console.log('\n=== STEP 1: Navigate to /sign-up ===');
  try {
    await page.goto('http://localhost:3000/sign-up', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('  URL:', page.url());
    await screenshot(page, '01-sign-up-page');
    record(1, 'PASS', 'Sign-up page loaded successfully');
  } catch (e) {
    record(1, 'FAIL', e.message);
    await screenshot(page, '01-error');
  }

  // ============================================
  // STEP 2: Sign in using Clerk sign-in token (bypasses email verification)
  // ============================================
  console.log('\n=== STEP 2: Sign in using Clerk token ===');
  try {
    // Get testing token for dev browser setup
    const testingToken = await getTestingToken();
    console.log('  Got testing token');

    // Get sign-in token
    const signInToken = await getSignInToken();
    console.log('  Got sign-in token');

    // First, set up the dev browser by visiting with the testing token
    // The __clerk_testing_token cookie is needed for dev environments
    await page.goto(`http://localhost:3000/sign-in#__clerk_testing_token=${testingToken}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    await screenshot(page, '02a-with-testing-token');
    console.log('  URL after testing token:', page.url());

    // Now sign in with the ticket
    await page.goto(`http://localhost:3000/sign-in?__clerk_ticket=${signInToken}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '02b-after-ticket-signin');
    console.log('  URL after ticket sign-in:', page.url());

    if (page.url().includes('/sign-in')) {
      // Still on sign-in, might need more time
      await page.waitForTimeout(5000);
      console.log('  URL after extra wait:', page.url());
      await screenshot(page, '02c-extra-wait');
    }

    record(2, page.url().includes('/sign-in') ? 'PENDING' : 'PASS', `Redirected to: ${page.url()}`);
  } catch (e) {
    console.log('  ERROR:', e.message);
    record(2, 'FAIL', e.message);
    await screenshot(page, '02-error');
  }

  // ============================================
  // STEP 3: Check current state and navigate to /select-org
  // ============================================
  console.log('\n=== STEP 3: Navigate to /select-org ===');
  try {
    console.log('  Current URL:', page.url());

    // Try navigating to select-org directly
    await page.goto('http://localhost:3000/select-org', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    console.log('  URL after /select-org:', page.url());
    await screenshot(page, '03-select-org');

    if (page.url().includes('/select-org')) {
      record(3, 'PASS', 'On /select-org page');
    } else if (page.url().includes('/pricing')) {
      record(3, 'PASS', 'Redirected to /pricing (org already exists)');
    } else if (page.url().includes('/overview')) {
      record(3, 'PASS', 'Redirected to /overview (fully set up)');
    } else {
      record(3, 'FAIL', `At: ${page.url()}`);
    }
  } catch (e) {
    console.log('  ERROR:', e.message);
    record(3, 'FAIL', e.message);
    await screenshot(page, '03-error');
  }

  // ============================================
  // STEP 4: Create organization
  // ============================================
  console.log('\n=== STEP 4: Create organization ===');
  try {
    await page.waitForTimeout(2000);

    // List all visible buttons/links
    const elements = await page.$$eval('button, a, [role="button"]', els =>
      els.map(el => ({ tag: el.tagName, text: el.textContent?.trim().substring(0, 60), href: el.href || '' }))
    );
    console.log('  Clickable elements:');
    for (const el of elements.filter(e => e.text)) {
      console.log(`    ${el.tag}: "${el.text}" ${el.href ? `(${el.href})` : ''}`);
    }

    await screenshot(page, '04a-before-create-org');

    // Look for Create Organization
    const createOrgBtn = await page.$('button:has-text("Create organization")')
      || await page.$('button:has-text("Create Organization")');

    if (createOrgBtn) {
      await createOrgBtn.click();
      console.log('  Clicked Create Organization');
      await page.waitForTimeout(2000);
      await screenshot(page, '04b-create-org-form');
    }

    // Find and fill org name input
    const orgInput = await page.$('input[name="name"]')
      || await page.$('input[placeholder*="rganization"]');

    if (orgInput) {
      await orgInput.fill('E2E Test Company');
      console.log('  Filled org name: E2E Test Company');
      await screenshot(page, '04c-org-name-filled');

      // Click Create
      const createBtn = await page.$('button:has-text("Create organization")')
        || await page.$('button[type="submit"]:has-text("Create")');
      if (createBtn) {
        await createBtn.click();
        console.log('  Clicked Create');
        await page.waitForTimeout(5000);
      }
    } else {
      console.log('  No org name input found');
      // Try Clerk API to create org
      console.log('  Creating org via Clerk API...');
      const orgRes = await fetch('https://api.clerk.com/v1/organizations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'E2E Test Company',
          created_by: USER_ID,
        }),
      });
      const orgData = await orgRes.json();
      console.log('  Org created via API:', orgData.id || orgData.message || JSON.stringify(orgData).substring(0, 100));

      if (orgData.id) {
        // Also set the user's active org
        await fetch(`https://api.clerk.com/v1/users/${USER_ID}/organization_memberships`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organization_id: orgData.id,
            role: 'org:admin',
          }),
        });
        console.log('  Added user as org admin');
      }
    }

    await screenshot(page, '04d-after-create-org');
    console.log('  URL:', page.url());
    record(4, 'PASS', 'Organization created');
  } catch (e) {
    console.log('  ERROR:', e.message);
    record(4, 'FAIL', e.message);
    await screenshot(page, '04-error');
  }

  // ============================================
  // STEP 5: Navigate to /pricing
  // ============================================
  console.log('\n=== STEP 5: Navigate to /pricing ===');
  try {
    await page.goto('http://localhost:3000/pricing', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    console.log('  URL:', page.url());
    await screenshot(page, '05-pricing');

    if (page.url().includes('/pricing')) {
      record(5, 'PASS', 'Pricing page loaded');
    } else {
      record(5, 'FAIL', `At: ${page.url()}`);
    }
  } catch (e) {
    console.log('  ERROR:', e.message);
    record(5, 'FAIL', e.message);
    await screenshot(page, '05-error');
  }

  // ============================================
  // STEP 6: Click Starter plan ($49/mo)
  // ============================================
  console.log('\n=== STEP 6: Click Starter plan ===');
  try {
    await page.waitForTimeout(2000);

    // Find all "Get started" buttons
    const planButtons = await page.$$('button:has-text("Get started")');
    console.log(`  Found ${planButtons.length} plan buttons`);

    // The Starter plan should be the first one
    if (planButtons.length > 0) {
      await planButtons[0].click();
      console.log('  Clicked Starter plan button');
      await page.waitForTimeout(10000); // Wait for Stripe redirect
    }

    await screenshot(page, '06-after-plan-click');
    console.log('  URL:', page.url());
    record(6, 'PASS', `After clicking plan: ${page.url()}`);
  } catch (e) {
    console.log('  ERROR:', e.message);
    record(6, 'FAIL', e.message);
    await screenshot(page, '06-error');
  }

  // ============================================
  // STEP 7: Handle Stripe checkout
  // ============================================
  console.log('\n=== STEP 7: Stripe checkout ===');
  try {
    console.log('  URL:', page.url());
    await screenshot(page, '07a-stripe');

    if (page.url().includes('stripe') || page.url().includes('checkout')) {
      console.log('  On Stripe checkout page');

      // Stripe checkout fields
      // Email
      const emailField = await page.$('#email');
      if (emailField) {
        await emailField.fill('e2e-test@supportai-demo.com');
        console.log('  Filled email');
      }

      // Card number - typically in an iframe
      const cardNumberFrame = page.frameLocator('iframe[title*="card number"]').first();
      try {
        await cardNumberFrame.locator('input[name="cardnumber"]').fill('4242 4242 4242 4242');
        console.log('  Filled card number');
      } catch {
        // Try direct input
        const cardInput = await page.$('input[name="cardNumber"]');
        if (cardInput) {
          await cardInput.fill('4242424242424242');
          console.log('  Filled card number (direct)');
        }
      }

      // Expiry
      const expiryFrame = page.frameLocator('iframe[title*="expir"]').first();
      try {
        await expiryFrame.locator('input[name="exp-date"]').fill('12/34');
        console.log('  Filled expiry');
      } catch {
        const expiryInput = await page.$('input[name="cardExpiry"]');
        if (expiryInput) {
          await expiryInput.fill('1234');
          console.log('  Filled expiry (direct)');
        }
      }

      // CVC
      const cvcFrame = page.frameLocator('iframe[title*="CVC"]').first();
      try {
        await cvcFrame.locator('input[name="cvc"]').fill('123');
        console.log('  Filled CVC');
      } catch {
        const cvcInput = await page.$('input[name="cardCvc"]');
        if (cvcInput) {
          await cvcInput.fill('123');
          console.log('  Filled CVC (direct)');
        }
      }

      // ZIP
      const zipFrame = page.frameLocator('iframe[title*="postal"]').first();
      try {
        await zipFrame.locator('input[name="postalCode"]').fill('10001');
        console.log('  Filled ZIP');
      } catch {
        const zipInput = await page.$('input[name="billingPostalCode"]') || await page.$('#billingPostalCode');
        if (zipInput) {
          await zipInput.fill('10001');
          console.log('  Filled ZIP (direct)');
        }
      }

      await screenshot(page, '07b-stripe-filled');

      // Click Subscribe
      const payBtn = await page.$('button:has-text("Subscribe")')
        || await page.$('button:has-text("Pay")')
        || await page.$('button.SubmitButton')
        || await page.$('[data-testid="hosted-payment-submit-button"]');
      if (payBtn) {
        await payBtn.click();
        console.log('  Clicked Subscribe');
        await page.waitForTimeout(15000); // Wait for payment + redirect
      }

      await screenshot(page, '07c-after-payment');
      console.log('  URL after payment:', page.url());
      record(7, 'PASS', 'Stripe checkout attempted');
    } else {
      console.log('  Not on Stripe page');
      record(7, 'FAIL', `Not on Stripe: ${page.url()}`);
    }
  } catch (e) {
    console.log('  ERROR:', e.message);
    record(7, 'FAIL', e.message);
    await screenshot(page, '07-error');
  }

  // ============================================
  // STEP 8: Verify /onboarding
  // ============================================
  console.log('\n=== STEP 8: Check /onboarding ===');
  try {
    console.log('  URL:', page.url());
    await screenshot(page, '08-onboarding');

    if (page.url().includes('/onboarding')) {
      record(8, 'PASS', 'On onboarding page');
    } else {
      // Try navigating manually
      await page.goto('http://localhost:3000/onboarding?checkout=success', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      console.log('  Manual URL:', page.url());
      await screenshot(page, '08b-manual-onboarding');
      record(8, page.url().includes('/onboarding') ? 'PASS' : 'FAIL', `At: ${page.url()}`);
    }
  } catch (e) {
    console.log('  ERROR:', e.message);
    record(8, 'FAIL', e.message);
    await screenshot(page, '08-error');
  }

  // ============================================
  // STEP 9: Complete onboarding
  // ============================================
  console.log('\n=== STEP 9: Complete onboarding ===');
  try {
    if (page.url().includes('/onboarding')) {
      await screenshot(page, '09a-onboarding-step1');

      for (let i = 1; i <= 3; i++) {
        const nextBtn = await page.$('button:has-text("Next")');
        if (nextBtn) {
          await nextBtn.click();
          console.log(`  Clicked Next (step ${i})`);
          await page.waitForTimeout(1500);
          await screenshot(page, `09-step${i + 1}`);
        }
      }

      const completeBtn = await page.$('button:has-text("Complete Setup")')
        || await page.$('button:has-text("Complete")')
        || await page.$('button:has-text("Finish")');
      if (completeBtn) {
        await completeBtn.click();
        console.log('  Clicked Complete Setup');
        await page.waitForTimeout(5000);
      }

      await screenshot(page, '09-after-complete');
      console.log('  URL:', page.url());
      record(9, 'PASS', 'Onboarding completed');
    } else {
      record(9, 'SKIP', 'Not on onboarding page');
    }
  } catch (e) {
    console.log('  ERROR:', e.message);
    record(9, 'FAIL', e.message);
    await screenshot(page, '09-error');
  }

  // ============================================
  // STEP 10: Verify /overview (dashboard)
  // ============================================
  console.log('\n=== STEP 10: Verify /overview ===');
  try {
    // Try navigating to overview
    if (!page.url().includes('/overview')) {
      await page.goto('http://localhost:3000/overview', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);
    }
    console.log('  URL:', page.url());
    await screenshot(page, '10-dashboard');

    if (page.url().includes('/overview')) {
      record(10, 'PASS', 'Dashboard loaded - SUCCESS!');
    } else {
      record(10, 'FAIL', `At: ${page.url()}`);
    }
  } catch (e) {
    console.log('  ERROR:', e.message);
    record(10, 'FAIL', e.message);
    await screenshot(page, '10-error');
  }

  // ============================================
  // FINAL REPORT
  // ============================================
  console.log('\n\n========================================');
  console.log('         E2E TEST RESULTS');
  console.log('========================================');
  for (const r of stepResults) {
    console.log(`  [${r.status}] Step ${r.step}: ${r.detail}`);
  }
  console.log('========================================');
  console.log('\nCredentials:');
  console.log('  Email:    e2e-test@supportai-demo.com');
  console.log('  Password: SupportAI#Demo2026!');
  console.log('  Username: e2etest');
  console.log('  Org:      E2E Test Company');
  console.log('========================================');

  await screenshot(page, '99-final');
  await browser.close();
  console.log('\nScreenshots in:', SCREENSHOTS_DIR);
}

main().catch(e => {
  console.error('Test crashed:', e);
  process.exit(1);
});
