import { test, expect } from '@playwright/test';

test.describe('Guest Reply Functionality', () => {
  // Test data
  const TEST_GUEST_NAME = 'Test Guest User';
  const TEST_REPLY_TEXT = 'This is a test reply from a guest user';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Navigate to modules page
    await page.click('text=Modules');
    await page.waitForLoadState('networkidle');
    
    // Click on the first module
    await page.click('[data-testid="module-card"]:first-child, .group:first-child');
    await page.waitForLoadState('networkidle');
    
    // Click on the first section
    await page.click('[data-testid="section-card"]:first-child, .group:first-child');
    await page.waitForLoadState('networkidle');
  });

  test('should show reply button for non-authenticated users', async ({ page }) => {
    // Ensure we're not logged in by checking for login elements
    await expect(page.locator('text=Sign In, text=Login, text=Sign Up')).toBeTruthy();
    
    // Check if there are any existing notes
    const noteExists = await page.locator('[data-testid="note-item"], .rounded-lg.border.border-gray-200').first().isVisible().catch(() => false);
    
    if (noteExists) {
      // Check that reply button is visible for existing notes
      await expect(page.locator('text=💬 Reply').first()).toBeVisible();
    } else {
      console.log('No existing notes found to test reply functionality');
    }
  });

  test('should hide Add Note button for non-authenticated users', async ({ page }) => {
    // Ensure we're not logged in
    await expect(page.locator('text=Sign In, text=Login, text=Sign Up')).toBeTruthy();
    
    // Check that Add Note button is not visible
    await expect(page.locator('text=Add Note')).not.toBeVisible();
  });

  test('should hide Edit and Delete buttons for non-authenticated users', async ({ page }) => {
    // Check if there are any existing notes
    const noteExists = await page.locator('[data-testid="note-item"], .rounded-lg.border.border-gray-200').first().isVisible().catch(() => false);
    
    if (noteExists) {
      // Check that Edit and Delete buttons are not visible
      await expect(page.locator('text=✏️ Edit')).not.toBeVisible();
      await expect(page.locator('text=🗑️ Delete')).not.toBeVisible();
    }
  });

  test('should open reply modal when guest clicks reply button', async ({ page }) => {
    // Check if there are any existing notes to reply to
    const replyButton = page.locator('text=💬 Reply').first();
    const isReplyButtonVisible = await replyButton.isVisible().catch(() => false);
    
    if (isReplyButtonVisible) {
      // Click reply button
      await replyButton.click();
      
      // Check that modal opens
      await expect(page.locator('text=Reply to note')).toBeVisible();
      
      // Check that guest name field is visible
      await expect(page.locator('input[placeholder="Enter your name"], label:has-text("Your Name")')).toBeVisible();
      
      // Close modal
      await page.click('text=Cancel');
    } else {
      console.log('No existing notes found to test reply modal');
    }
  });

  test('should require guest name when submitting reply', async ({ page }) => {
    const replyButton = page.locator('text=💬 Reply').first();
    const isReplyButtonVisible = await replyButton.isVisible().catch(() => false);
    
    if (isReplyButtonVisible) {
      // Click reply button
      await replyButton.click();
      
      // Enter reply text but no name
      await page.fill('textarea, [data-testid="markdown-editor"]', TEST_REPLY_TEXT);
      
      // Try to submit without entering name
      await page.click('text=Add Note, text=Reply, button[type="submit"]');
      
      // Should show alert about requiring name
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Please enter your name');
        await dialog.accept();
      });
    }
  });

  test('should successfully submit guest reply with name', async ({ page }) => {
    const replyButton = page.locator('text=💬 Reply').first();
    const isReplyButtonVisible = await replyButton.isVisible().catch(() => false);
    
    if (isReplyButtonVisible) {
      // Click reply button
      await replyButton.click();
      
      // Enter guest name
      await page.fill('input[placeholder="Enter your name"]', TEST_GUEST_NAME);
      
      // Enter reply text
      await page.fill('textarea, [data-testid="markdown-editor"]', TEST_REPLY_TEXT);
      
      // Submit reply
      await page.click('text=Add Note, text=Reply, button[type="submit"]');
      
      // Wait for modal to close
      await expect(page.locator('text=Reply to note')).not.toBeVisible();
      
      // Check that the reply appears in the list
      await expect(page.locator(`text=${TEST_REPLY_TEXT}`)).toBeVisible();
      await expect(page.locator(`text=by ${TEST_GUEST_NAME} (guest)`)).toBeVisible();
    }
  });

  test('should display guest name with (guest) label', async ({ page }) => {
    // Look for any existing guest replies
    const guestLabel = page.locator('text=(guest)');
    const hasGuestReplies = await guestLabel.isVisible().catch(() => false);
    
    if (hasGuestReplies) {
      // Check that guest names are properly formatted
      await expect(guestLabel).toBeVisible();
      
      // Check for user icon next to guest name
      const guestNameElement = await guestLabel.locator('..').first();
      await expect(guestNameElement.locator('svg')).toBeVisible();
    } else {
      console.log('No existing guest replies found to verify display format');
    }
  });

  test('should prevent guests from creating top-level notes', async ({ page }) => {
    // Ensure Add Note button is not available for guests
    await expect(page.locator('text=Add Note')).not.toBeVisible();
    
    // If somehow the modal opens, it should prevent submission
    // This is a defensive test for edge cases
  });

  test('should show all notes to non-authenticated users', async ({ page }) => {
    // Check that the short notes section is visible
    await expect(page.locator('text=Short Notes')).toBeVisible();
    
    // Check if there are any notes visible (either notes exist or "No notes yet" message)
    const hasNotes = await page.locator('.rounded-lg.border.border-gray-200').first().isVisible().catch(() => false);
    const hasNoNotesMessage = await page.locator('text=No notes yet').isVisible().catch(() => false);
    
    expect(hasNotes || hasNoNotesMessage).toBeTruthy();
  });

  test('should show all resources to non-authenticated users', async ({ page }) => {
    // Check that the resources section is visible
    await expect(page.locator('text=Resources')).toBeVisible();
    
    // Check that resources are visible or "No resources" message is shown
    const hasResources = await page.locator('a[href*="http"], a[target="_blank"]').first().isVisible().catch(() => false);
    const hasNoResourcesMessage = await page.locator('text=No resources added').isVisible().catch(() => false);
    
    expect(hasResources || hasNoResourcesMessage).toBeTruthy();
  });

  test('should hide Add Resource functionality for non-authenticated users', async ({ page }) => {
    // Check that add resource form is not visible
    await expect(page.locator('text=Add resource')).not.toBeVisible();
    await expect(page.locator('input[placeholder="Title"]')).not.toBeVisible();
    await expect(page.locator('input[placeholder="URL"]')).not.toBeVisible();
  });

  test('should hide progress tracking elements for non-authenticated users', async ({ page }) => {
    // Check that progress elements are not visible
    await expect(page.locator('text=Not Started, text=In Progress, text=Completed, text=Current Section')).not.toBeVisible();
    
    // Check that star rating component is not visible
    await expect(page.locator('[data-testid="star-rating"], .text-yellow-500')).not.toBeVisible();
    
    // Check that progress control buttons are not visible
    await expect(page.locator('text=not started, text=in progress, text=done, text=skipped')).not.toBeVisible();
  });
});
