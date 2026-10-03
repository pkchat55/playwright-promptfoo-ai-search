import { test, expect } from '@playwright/test';

test.describe('AI Search UI', () => {
  test('should return a relevant answer for parental leave', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Ask a question').fill('What is the parental leave policy?');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.locator('[data-testid="ai-response"]')).toContainText('parental leave');
    await expect(page.locator('#status')).toHaveText('Complete');
  });

  test('should handle unknown questions without hallucinating a specific policy', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Ask a question').fill('What is the Mars policy for teleportation?');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.locator('[data-testid="ai-response"]')).toContainText('could not find a reliable answer');
  });
});
