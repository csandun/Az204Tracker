import { test, expect } from '@playwright/test';

test.describe('Complete Guest Reply Workflow', () => {
  const TEST_GUEST_NAME = 'Playwright Test Guest';
  const TEST_REPLY_MESSAGE = 'This is an automated test reply from a guest user';

  test('complete guest reply workflow', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('/');
    
    // Step 2: Navigate to modules
    await page.click('text=Modules');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Click on first module
    const moduleCards = page.locator('.group, [data-testid="module-card"]');
    await expect(moduleCards.first()).toBeVisible();
    await moduleCards.first().click();
    await page.waitForLoadState('networkidle');
    
    // Step 4: Click on first section
    const sectionCards = page.locator('.group, [data-testid="section-card"]');
    await expect(sectionCards.first()).toBeVisible();
    await sectionCards.first().click();
    await page.waitForLoadState('networkidle');
    
    // Step 5: Verify we're on a section page
    await expect(page.locator('h3:has-text("Short Notes")')).toBeVisible();
    
    // Step 6: Check if there are existing notes to reply to
    const existingNotes = page.locator('.rounded-lg.border.border-gray-200, [data-testid="note-item"]');
    const noteCount = await existingNotes.count();
    
    if (noteCount === 0) {
      console.log('No existing notes found. Guest reply test requires existing notes.');
      return;
    }
    
    // Step 7: Find and click a reply button
    const replyButtons = page.locator('button:has-text("💬 Reply")');
    await expect(replyButtons.first()).toBeVisible();
    await replyButtons.first().click();
    
    // Step 8: Verify reply modal opens
    await expect(page.locator('text=Reply to note')).toBeVisible();
    
    // Step 9: Verify guest name field is present
    await expect(page.locator('text=Your Name (required for guests)')).toBeVisible();
    const guestNameInput = page.locator('input[placeholder="Enter your name"]');
    await expect(guestNameInput).toBeVisible();
    
    // Step 10: Verify textarea for reply content
    const replyTextarea = page.locator('textarea');
    await expect(replyTextarea).toBeVisible();
    
    // Step 11: Test validation - try to submit without name
    await replyTextarea.fill(TEST_REPLY_MESSAGE);
    
    let alertShown = false;
    page.on('dialog', async dialog => {
      alertShown = true;
      expect(dialog.message()).toContain('Please enter your name');
      await dialog.accept();
    });
    
    await page.click('button:has-text("Add Note")');
    
    // Give time for alert to show
    await page.waitForTimeout(1000);
    expect(alertShown).toBe(true);
    
    // Step 12: Fill in guest name
    await guestNameInput.fill(TEST_GUEST_NAME);
    
    // Step 13: Submit the reply
    await page.click('button:has-text("Add Note")');
    
    // Step 14: Wait for modal to close
    await expect(page.locator('text=Reply to note')).not.toBeVisible();
    
    // Step 15: Verify the reply appears in the notes list
    await expect(page.locator(`text=${TEST_REPLY_MESSAGE}`)).toBeVisible();
    await expect(page.locator(`text=by ${TEST_GUEST_NAME} (guest)`)).toBeVisible();
    
    // Step 16: Verify guest reply formatting
    const guestReply = page.locator(`text=by ${TEST_GUEST_NAME} (guest)`);
    await expect(guestReply).toBeVisible();
    
    // Check for user icon next to guest name
    const guestReplyContainer = guestReply.locator('..');
    await expect(guestReplyContainer.locator('svg')).toBeVisible();
    
    // Step 17: Verify the new reply also has a reply button (for further replies)
    const newReplyButtons = page.locator('button:has-text("💬 Reply")');
    const newButtonCount = await newReplyButtons.count();
    expect(newButtonCount).toBeGreaterThan(0);
    
    console.log('✅ Complete guest reply workflow test passed!');
  });

  test('guest cannot edit or delete their own replies', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to a section
    await page.click('text=Modules');
    await page.waitForLoadState('networkidle');
    await page.click('.group:first-child');
    await page.waitForLoadState('networkidle');
    await page.click('.group:first-child');
    await page.waitForLoadState('networkidle');
    
    // Look for guest replies (identified by "(guest)" text)
    const guestReplies = page.locator('text=(guest)');
    const guestReplyCount = await guestReplies.count();
    
    if (guestReplyCount > 0) {
      // Find the parent container of a guest reply
      const guestReplyContainer = guestReplies.first().locator('../..');
      
      // Verify that edit and delete buttons are not present for guest replies
      await expect(guestReplyContainer.locator('button:has-text("✏️ Edit")')).not.toBeVisible();
      await expect(guestReplyContainer.locator('button:has-text("🗑️ Delete")')).not.toBeVisible();
    } else {
      console.log('No guest replies found to test edit/delete restrictions');
    }
  });

  test('guest reply should be nested correctly', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to a section
    await page.click('text=Modules');
    await page.waitForLoadState('networkidle');
    await page.click('.group:first-child');
    await page.waitForLoadState('networkidle');
    await page.click('.group:first-child');
    await page.waitForLoadState('networkidle');
    
    // Look for nested replies (they should have indentation)
    const nestedReplies = page.locator('.ml-6');
    const nestedCount = await nestedReplies.count();
    
    if (nestedCount > 0) {
      // Verify that nested replies are properly indented
      await expect(nestedReplies.first()).toBeVisible();
      
      // Check if any nested replies are from guests
      const guestNestedReplies = nestedReplies.locator('text=(guest)');
      const guestNestedCount = await guestNestedReplies.count();
      
      if (guestNestedCount > 0) {
        await expect(guestNestedReplies.first()).toBeVisible();
        console.log('✅ Guest replies are properly nested');
      }
    }
  });

  test('multiple guests can reply to same note', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to a section
    await page.click('text=Modules');
    await page.waitForLoadState('networkidle');
    await page.click('.group:first-child');
    await page.waitForLoadState('networkidle');
    await page.click('.group:first-child');
    await page.waitForLoadState('networkidle');
    
    const replyButton = page.locator('button:has-text("💬 Reply")').first();
    const isVisible = await replyButton.isVisible().catch(() => false);
    
    if (isVisible) {
      // First guest reply
      await replyButton.click();
      await page.fill('input[placeholder="Enter your name"]', 'Guest User 1');
      await page.fill('textarea', 'First guest reply');
      await page.click('button:has-text("Add Note")');
      
      // Wait for modal to close
      await expect(page.locator('text=Reply to note')).not.toBeVisible();
      
      // Second guest reply to the same note
      await replyButton.click();
      await page.fill('input[placeholder="Enter your name"]', 'Guest User 2');
      await page.fill('textarea', 'Second guest reply');
      await page.click('button:has-text("Add Note")');
      
      // Wait for modal to close
      await expect(page.locator('text=Reply to note')).not.toBeVisible();
      
      // Verify both replies are visible
      await expect(page.locator('text=by Guest User 1 (guest)')).toBeVisible();
      await expect(page.locator('text=by Guest User 2 (guest)')).toBeVisible();
      
      console.log('✅ Multiple guests can reply to the same note');
    }
  });
});
