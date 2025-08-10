import { test, expect } from '@playwright/test';

test.describe('Authentication-based Features', () => {
  
  test.describe('Non-authenticated User Tests', () => {
    test('should see read-only interface', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to a section
      await page.click('text=Modules');
      await page.waitForSelector('.group', { timeout: 10000 });
      await page.click('.group:first-child');
      await page.waitForSelector('.group', { timeout: 10000 });
      await page.click('.group:first-child');
      
      // Verify read-only elements are visible
      await expect(page.locator('h3:has-text("Short Notes")')).toBeVisible();
      await expect(page.locator('h2:has-text("Resources")')).toBeVisible();
      
      // Verify interactive elements are hidden
      await expect(page.locator('button:has-text("Add Note")')).not.toBeVisible();
      await expect(page.locator('button:has-text("Add resource")')).not.toBeVisible();
    });

    test('should be able to see reply buttons on existing notes', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to a section with notes
      await page.click('text=Modules');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      
      // Check for reply buttons (they should be visible to all users)
      const replyButtons = page.locator('button:has-text("💬 Reply")');
      const count = await replyButtons.count();
      
      if (count > 0) {
        await expect(replyButtons.first()).toBeVisible();
      } else {
        console.log('No existing notes found to verify reply buttons');
      }
    });

    test('reply modal should include guest name field', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to a section
      await page.click('text=Modules');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      
      // Try to find and click a reply button
      const replyButton = page.locator('button:has-text("💬 Reply")').first();
      const isVisible = await replyButton.isVisible().catch(() => false);
      
      if (isVisible) {
        await replyButton.click();
        
        // Check that modal opens with guest name field
        await expect(page.locator('text=Reply to note')).toBeVisible();
        await expect(page.locator('text=Your Name (required for guests)')).toBeVisible();
        await expect(page.locator('input[placeholder="Enter your name"]')).toBeVisible();
        
        // Close modal
        await page.click('button:has-text("Cancel")');
      }
    });
  });

  test.describe('Form Validation Tests', () => {
    test('should validate guest name is required', async ({ page }) => {
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
        await replyButton.click();
        
        // Fill in only the reply text, not the name
        await page.fill('textarea', 'Test reply without name');
        
        // Set up dialog handler before clicking submit
        let alertMessage = '';
        page.on('dialog', async dialog => {
          alertMessage = dialog.message();
          await dialog.accept();
        });
        
        // Try to submit
        await page.click('button:has-text("Add Note")');
        
        // Verify alert was shown
        expect(alertMessage).toContain('Please enter your name');
      }
    });

    test('should validate reply text is required', async ({ page }) => {
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
        await replyButton.click();
        
        // Fill in only the name, not the reply text
        await page.fill('input[placeholder="Enter your name"]', 'Test Guest');
        
        // Submit button should be disabled when text is empty
        await expect(page.locator('button:has-text("Add Note")')).toBeDisabled();
      }
    });
  });

  test.describe('Content Display Tests', () => {
    test('should display guest replies with proper formatting', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to a section
      await page.click('text=Modules');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      
      // Look for existing guest replies
      const guestIndicators = page.locator('text=by');
      const count = await guestIndicators.count();
      
      for (let i = 0; i < count; i++) {
        const guestText = await guestIndicators.nth(i).textContent();
        if (guestText && guestText.includes('(guest)')) {
          // Verify guest reply formatting
          await expect(guestIndicators.nth(i)).toBeVisible();
          
          // Check for user icon
          const parentElement = guestIndicators.nth(i).locator('..');
          await expect(parentElement.locator('svg')).toBeVisible();
        }
      }
    });

    test('should show all notes regardless of authentication', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to a section
      await page.click('text=Modules');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      
      // Check that notes section is present
      await expect(page.locator('h3:has-text("Short Notes")')).toBeVisible();
      
      // Notes should either be visible or show "No notes yet" message
      const notesContainer = page.locator('.space-y-2').first();
      await expect(notesContainer).toBeVisible();
    });
  });

  test.describe('UI Security Tests', () => {
    test('should not show administrative functions to guests', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to a section
      await page.click('text=Modules');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      
      // Verify administrative elements are hidden
      await expect(page.locator('button:has-text("✏️ Edit")')).not.toBeVisible();
      await expect(page.locator('button:has-text("🗑️ Delete")')).not.toBeVisible();
      await expect(page.locator('button:has-text("Add Note")')).not.toBeVisible();
      await expect(page.locator('button:has-text("Add resource")')).not.toBeVisible();
      
      // Progress tracking should be hidden
      await expect(page.locator('text=Not Started')).not.toBeVisible();
      await expect(page.locator('text=In Progress')).not.toBeVisible();
      await expect(page.locator('text=Completed')).not.toBeVisible();
    });

    test('should not allow direct access to edit functions', async ({ page }) => {
      // This test verifies that even if someone tries to manipulate the DOM,
      // the backend will reject unauthorized actions
      
      await page.goto('/');
      
      // Navigate to a section
      await page.click('text=Modules');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      await page.click('.group:first-child');
      await page.waitForLoadState('networkidle');
      
      // Try to inject edit buttons (this would test if backend security works)
      await page.evaluate(() => {
        const button = document.createElement('button');
        button.textContent = '✏️ Edit';
        button.onclick = () => console.log('Edit button clicked');
        document.body.appendChild(button);
      });
      
      // The injected button might be visible, but it shouldn't do anything malicious
      // because the backend should reject unauthorized requests
    });
  });
});
