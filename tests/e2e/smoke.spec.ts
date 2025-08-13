import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/GreekDash/)
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('public chapter page loads', async ({ page }) => {
    await page.goto('/alpha-beta-gamma')
    await expect(page.locator('h1')).toContainText('Alpha Beta Gamma')
  })
})