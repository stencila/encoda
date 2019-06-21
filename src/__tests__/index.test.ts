import stencila from '@stencila/schema'
// @ts-ignore
import delay from 'delay'
import fs from 'fs-extra'
import path from 'path'
import tempy from 'tempy'
import { codecList, convert, dump, handled, load, match, read, write } from '..'
import * as json from '../codecs/json'
import { create, VFile } from '../util/vfile'
import * as yaml from '../codecs/yaml'
import { fixture } from './helpers'

fs.ensureDirSync(path.join(__dirname, 'output'))

describe('match', () => {
  // A dummy codec for testing matching
  const ssf = {
    fileNames: ['super-special-file'],
    extNames: ['ssf'],
    mediaTypes: ['application/vnd.super-corp.super-special-file'],
    sniff: async (content: string) => /^SSF:/.test(content),

    // Required, but don't do anything
    decode: async (file: VFile) => null,
    encode: async (node: stencila.Node, options: {} = {}) => create()
  }
  codecList.push(ssf)

  it('works with file paths', async () => {
    expect(await match('./file.json')).toEqual(json)
    expect(await match('./dir/file.json')).toEqual(json)
    expect(await match('./file.yaml')).toEqual(yaml)
    expect(await match('./file.yml')).toEqual(yaml)
    expect(await match('./file.ssf')).toEqual(ssf)
    expect(await match('./super-special-file')).toEqual(ssf)
  })

  it('works with format as extension name', async () => {
    expect(await match(undefined, 'json')).toEqual(json)
    expect(await match(undefined, 'yaml')).toEqual(yaml)
    expect(await match(undefined, 'yml')).toEqual(yaml)
    expect(await match(undefined, 'ssf')).toEqual(ssf)
  })

  it('works with format as media type', async () => {
    expect(await match(undefined, 'application/json')).toEqual(json)
    expect(await match(undefined, 'text/yaml')).toEqual(yaml)
    expect(
      await match(undefined, 'application/vnd.super-corp.super-special-file')
    ).toEqual(ssf)
  })

  it('works with file paths with format override', async () => {
    expect(await match('./file.foo', 'json')).toEqual(json)
    expect(await match('./file.yaml', 'application/json')).toEqual(json)
    expect(await match('./file.json', 'text/yaml')).toEqual(yaml)
    expect(await match('./file.json', 'ssf')).toEqual(ssf)
  })

  it('works with content sniffing', async () => {
    expect(await match('SSF: woot!')).toEqual(ssf)
  })

  it('throws when unable to find a matching codec', async () => {
    await expect(match('./foo.bar')).rejects.toThrow(
      'No codec could be found for content "./foo.bar".'
    )
    await expect(match('foo')).rejects.toThrow(
      'No codec could be found for content "foo".'
    )
    await expect(match(undefined, 'foo')).rejects.toThrow(
      'No codec could be found for format "foo".'
    )
  })
})

test('handle', async () => {
  expect(await handled('./file.json')).toBeTruthy()
  expect(await handled(undefined, 'json')).toBeTruthy()
  expect(await handled(undefined, 'application/json')).toBeTruthy()

  expect(await handled('./file.foo')).toBeFalsy()
  expect(await handled(undefined, 'foo')).toBeFalsy()
  expect(await handled(undefined, 'application/foo')).toBeFalsy()
})

/**
 * The following are simple tests of the main API and don't do any
 * actual conversion. See other tests for that.
 */

const simpleThing = {
  type: 'Thing',
  name: 'Simple thing'
}

const simpleThingJson = JSON.stringify(simpleThing, null, '  ')

const simpleThingPath = fixture('thing/simple/simple-thing.json')

test('load', async () => {
  expect(await load(simpleThingJson, 'json')).toEqual(simpleThing)
})

test('dump', async () => {
  expect(await dump(simpleThing, { format: 'json' })).toEqual(simpleThingJson)
})

describe('read', () => {
  it('works with file paths', async () => {
    expect(await read(simpleThingPath)).toEqual(simpleThing)
  })

  it('works with content', async () => {
    expect(await read(simpleThingJson, 'json')).toEqual(simpleThing)
  })

  if (!process.env.CI)
    it('works with stdin', async () => {
      const promise = read('-', 'json')

      process.stdin.push(simpleThingJson)
      await delay(10)
      process.stdin.emit('end')

      expect(await promise).toEqual(simpleThing)
    })
})

describe('write', () => {
  it('works with files', async () => {
    const out = tempy.file({ extension: 'json' })
    await write(simpleThing, out)
    expect(fs.readJsonSync(out)).toEqual(simpleThing)
  })

  it('works with stdout', async () => {
    const consoleLog = jest.spyOn(console, 'log')
    await write(simpleThing, '-', { format: 'json' })
    expect(consoleLog).toHaveBeenCalledWith(simpleThingJson)
  })
})

describe('convert', () => {
  if (!process.env.CI)
    it('works with file paths', async () => {
      const inp = simpleThingPath
      const out = tempy.file({ extension: 'json' })
      const result = await convert(inp, out)

      expect(fs.readJsonSync(inp)).toEqual(fs.readJsonSync(out))
      expect(result).toEqual(simpleThingJson)
    })

  it('works with content as an argument and return', async () => {
    const inp = simpleThingJson
    const out = undefined
    const result = await convert(inp, out, { from: 'json', to: 'json' })

    expect(result).toEqual(inp)
  })

  it('works with stdout', async () => {
    // Don't seem to be able to test reading from stdin in same
    // file as above test for read() from stdin. So just testing stdout.
    const inp = simpleThingJson
    const consoleLog = jest.spyOn(console, 'log')
    const result = await convert(inp, '-', { from: 'json', to: 'json' })

    expect(consoleLog).toHaveBeenCalledWith(simpleThingJson)
    expect(result).toEqual(simpleThingJson)
  })

  if (!process.env.APPVEYOR)
    it.skip('returns a file path for "content-less" vfiles', async () => {
      const inp = `A paragraph\n`
      const out = tempy.file()
      // tslint:disable-next-line: no-unnecessary-type-assertion
      const result = (await convert(inp, out, {
        from: 'md',
        to: 'docx'
      })) as string

      expect(result).toEqual(out)
      expect(fs.existsSync(result)).toBeTruthy()
      expect(fs.lstatSync(result).size).toBeGreaterThan(0)
    })
})
