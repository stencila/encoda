import { page, shutdown } from './puppeteer'

// This test often creashed on Windows CI (due to memory limits?)
// e.g https://dev.azure.com/stencila/stencila/_build/results?buildId=657&view=logs&j=b17395f6-68a3-5682-0476-d3f6f1043109&t=0d6dcb53-0957-53aa-c18a-237166af945a&l=464
// so only run if not there.
if (!(process.env.CI && process.platform === 'win32'))
  test('page', async () => {
    const first = await page()
    expect(first).toBeTruthy()

    // Get a different page the second time
    const second = await page()
    expect(second).toBeTruthy()
    expect(second).not.toBe(first)

    expect(await shutdown()).toBeUndefined()
    // Can call a second time without blowing up
    expect(await shutdown()).toBeUndefined()
  })
