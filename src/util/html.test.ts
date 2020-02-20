import { themePath, themes } from '@stencila/thema'
import { nockRecord } from '../__tests__/helpers'
import { getThemeAssets, isTheme } from './html'

const themaThemes = Object.entries(themes)
const themeUrl = 'http://unpkg.com/@stencila/thema@1.5.3/dist/themes/stencila'

describe('Check if `theme` is a Thema theme', () => {
  test.each(themaThemes)('Thema themes - %s', (themeKey, themeValue) => {
    expect(isTheme(themeKey)).toBe(true)
    expect(isTheme(themeValue)).toBe(true)
  })

  test('File paths', () => {
    expect(isTheme('/my/path/to/directory')).toBe(false)
  })

  test('URLs', () => {
    expect(isTheme(themeUrl)).toBe(false)
  })
})

describe('Resolve theme arguments', () => {
  test.each(themaThemes)('Thema themes - %s', async (themeKey, themeValue) => {
    const theme = await getThemeAssets(themeKey)

    expect(theme.scripts[0]).toMatch(`${themePath}/${themeValue}/index.js`)
    expect(theme.styles[0]).toMatch(`${themePath}/${themeValue}/styles.css`)
  })

  test('Full URL', async () => {
    const theme = await getThemeAssets(themeUrl)

    expect(theme.scripts[0]).toMatch(`${themeUrl}/index.js`)
    expect(theme.styles[0]).toMatch(`${themeUrl}/styles.css`)
  })

  test('Full URL - top level domain', async () => {
    const themeUrl = 'http://example.com'
    const theme = await getThemeAssets(themeUrl)

    expect(theme.scripts[0]).toMatch(`${themeUrl}/index.js`)
    expect(theme.styles[0]).toMatch(`${themeUrl}/styles.css`)
  })

  test('Full URL - ending with a filename', async () => {
    const theme = await getThemeAssets(themeUrl + '/styles.css')

    expect(theme.scripts[0]).toMatch(`${themeUrl}/index.js`)
    expect(theme.styles[0]).toMatch(`${themeUrl}/styles.css`)
  })

  test('Full URL - ending with a trailing slash', async () => {
    const theme = await getThemeAssets(themeUrl + '/')

    expect(theme.scripts[0]).toMatch(`${themeUrl}/index.js`)
    expect(theme.styles[0]).toMatch(`${themeUrl}/styles.css`)
  })

  test('Fetching UNPKG asset by Thema name', async () => {
    const theme = await getThemeAssets(themes.elife)

    expect(theme.scripts[0]).toMatch(
      `https://unpkg.com/@stencila/thema@1/dist/themes/${themes.elife}/index.js`
    )
    expect(theme.styles[0]).toMatch(
      `https://unpkg.com/@stencila/thema@1/dist/themes/${themes.elife}/styles.css`
    )
  })

  test.each(themaThemes)(
    'Bundle theme contents by Thema name - %s',
    async themeKey => {
      const theme = await getThemeAssets(themeKey, true)

      expect(theme.scripts[0]).toMatch('parcelRequire=')
      expect(theme.styles[0]).toMatch(/\[itemprop=.*\]{/)
    }
  )

  test('Bundle theme contents from URL', async () => {
    const stopRecording = await nockRecord('nock-record-theme-from-url.json')
    const theme = await getThemeAssets(themeUrl, true)
    stopRecording()

    expect(theme.scripts[0]).toMatch('parcelRequire=')
    expect(theme.styles[0]).toMatch(/\[itemprop=.*\]{/)
  })
})
