import { page } from '../src/puppeteer'

test('page', async () => {
  const p = page()

  const q = await p()
  expect(q).toBeTruthy()
  // Get the same page the second time
  expect(await p()).toBe(q)

  expect(await p('close')).toBeUndefined()
  // Can call a second time without blowing up
  expect(await p('close')).toBeUndefined()
})
