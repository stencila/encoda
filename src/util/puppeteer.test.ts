import { page, shutdown } from './puppeteer'

test('page', async () => {
  const first = await page()
  expect(first).toBeTruthy()

  // Get a different the second time
  const second = await page()
  expect(second).toBeTruthy()
  expect(second).not.toBe(first)

  expect(await shutdown()).toBeUndefined()
  // Can call a second time without blowing up
  expect(await shutdown()).toBeUndefined()
})
