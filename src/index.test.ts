import delay from 'delay'
import fs from 'fs-extra'
import os from 'os'
import tempy from 'tempy'
import { codecList, convert, dump, handled, load, match, read, write } from '.'
import { JsonCodec } from './codecs/json'
import { TxtCodec } from './codecs/txt'
import { commonEncodeDefaults } from './codecs/types'
import { YamlCodec } from './codecs/yaml'
import * as ssf from './codecs/__mocks__/ssf'
import { fixture } from './__tests__/helpers'

describe('match', () => {
  codecList.push('__mocks__/ssf')

  it('works with file paths', async () => {
    expect(await match('./file.json')).toBeInstanceOf(JsonCodec)
    expect(await match('./dir/file.json')).toBeInstanceOf(JsonCodec)
    expect(await match('./file.yaml')).toBeInstanceOf(YamlCodec)
    expect(await match('./file.yml')).toBeInstanceOf(YamlCodec)
    expect(await match('./file.ssf')).toBeInstanceOf(ssf.SsfCodec)
    expect(await match('./super-special-file')).toBeInstanceOf(ssf.SsfCodec)
  })

  it('works with format as extension name', async () => {
    expect(await match(undefined, 'json')).toBeInstanceOf(JsonCodec)
    expect(await match(undefined, 'yaml')).toBeInstanceOf(YamlCodec)
    expect(await match(undefined, 'yml')).toBeInstanceOf(YamlCodec)
    expect(await match(undefined, 'ssf')).toBeInstanceOf(ssf.SsfCodec)
  })

  it('works with format as media type', async () => {
    expect(await match(undefined, 'application/json')).toBeInstanceOf(JsonCodec)
    expect(await match(undefined, 'text/yaml')).toBeInstanceOf(YamlCodec)
    expect(
      await match(undefined, 'application/vnd.super-corp.super-special-file')
    ).toBeInstanceOf(ssf.SsfCodec)
  })

  it('works with file paths with format override', async () => {
    expect(await match('./file.foo', 'json')).toBeInstanceOf(JsonCodec)
    // expect(await match('./file.yaml', 'application/json')).toBeInstanceOf(json)
    // expect(await match('./file.json', 'text/yaml')).toBeInstanceOf(yaml)
    expect(await match('./file.json', 'ssf')).toBeInstanceOf(ssf.SsfCodec)
  })

  it('works with content sniffing', async () => {
    expect(await match('SSF: woot!')).toBeInstanceOf(ssf.SsfCodec)
  })

  it('falls back to plain text when unable to find a matching codec', async () => {
    expect(await match('./foo.bar')).toBeInstanceOf(TxtCodec)
    expect(await match('foo')).toBeInstanceOf(TxtCodec)
    expect(await match(undefined, 'foo')).toBeInstanceOf(TxtCodec)
  })
})

test('handle', async () => {
  expect(await handled('./file.json')).toBeTruthy()
  expect(await handled(undefined, 'json')).toBeTruthy()
  expect(await handled(undefined, 'application/json')).toBeTruthy()
})

/**
 * The following are simple tests of the main API and don't do any
 * actual conversion. See other tests for that.
 */

const simpleThing = {
  type: 'Thing',
  name: 'Simple thing',
}

const simpleThingJson = JSON.stringify(simpleThing, null, '  ')

const simpleThingPath = fixture('thing/simple.json')

test('load', async () => {
  expect(await load(simpleThingJson, 'json')).toEqual(simpleThing)
})

test('dump', async () => {
  expect(await dump(simpleThing, 'json')).toEqual(simpleThingJson)
})

describe('read', () => {
  it('works with file paths', async () => {
    expect(await read(simpleThingPath)).toEqual(simpleThing)
  })

  it('works with content', async () => {
    expect(await read(simpleThingJson, 'json')).toEqual(simpleThing)
  })

  if (!process.env.CI)
    it.skip('works with stdin', async () => {
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
    await write(simpleThing, '-', { ...commonEncodeDefaults, format: 'json' })
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
      expect(result).toEqual(out)
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
    await convert(inp, '-', { from: 'json', to: 'json' })

    expect(consoleLog).toHaveBeenCalledWith(simpleThingJson)
  })

  if (!os.type().includes('Windows'))
    it('returns a file path for "content-less" vfiles', async () => {
      const inp = `A paragraph\n`
      const out = tempy.file()
      // tslint:disable-next-line: no-unnecessary-type-assertion
      const result = (await convert(inp, out, {
        from: 'md',
        to: 'docx',
      })) as string

      expect(result).toEqual(out)
      expect(fs.existsSync(result)).toBeTruthy()
      expect(fs.lstatSync(result).size).toBeGreaterThan(0)
    })
})
