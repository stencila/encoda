import stencila from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import {
  compilerList,
  convert,
  dump,
  handled,
  isPath,
  load,
  match,
  read,
  write
} from '../src'
import * as json from '../src/json'
import { create, VFile } from '../src/vfile'
import * as yaml from '../src/yaml'
import { fixture } from './helpers'

test('isPath', () => {
  expect(isPath('/')).toBe(true)
  expect(isPath('C:\\')).toBe(true)
  expect(isPath('/foo/bar.txt')).toBe(true)
  expect(isPath('C:\\foo\\bar.txt')).toBe(true)
  expect(isPath('./')).toBe(true)
  expect(isPath('.\\')).toBe(true)
  expect(isPath('./foo.txt')).toBe(true)
  expect(isPath('../../')).toBe(true)
  expect(isPath('..\\..\\')).toBe(true)
  expect(isPath('../../foo.txt')).toBe(true)

  // A file local to where tests are executed that does exist
  expect(isPath('package.json')).toBe(true)

  expect(isPath('foo.txt')).toBe(false)
  expect(isPath('a: foo')).toBe(false)
  expect(isPath('foo/bar.txt')).toBe(false)
  expect(isPath('Foo bar baz')).toBe(false)
})

describe('match', () => {
  // A dummy compiler for testing matching
  const ssf = {
    fileNames: ['super-special-file'],
    extNames: ['ssf'],
    mediaTypes: ['application/vnd.super-corp.super-special-file'],
    sniff: async (content: string) => /^SSF:/.test(content),

    // Required, but don't do anything
    parse: async (file: VFile) => null,
    unparse: async (node: stencila.Node, filePath?: string) => create()
  }
  compilerList.push(ssf)

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

  it('throws when unable to find a matching compiler', async () => {
    await expect(match('./foo.bar')).rejects.toThrow(
      'No compiler could be found for content "./foo.bar".'
    )
    await expect(match('foo')).rejects.toThrow(
      'No compiler could be found for content "foo".'
    )
    await expect(match(undefined, 'foo')).rejects.toThrow(
      'No compiler could be found for format "foo".'
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

test('load', async () => {
  expect(await load(simpleThingJson, 'json')).toEqual(simpleThing)
})

test('dump', async () => {
  expect(await dump(simpleThing, 'json')).toEqual(simpleThingJson)
})

describe('read', () => {
  it('works with files', async () => {
    expect(await read(fixture('thing/simple/simple-thing.json'))).toEqual(
      simpleThing
    )
  })

  it('works with content', async () => {
    expect(await read(simpleThingJson, 'json')).toEqual(simpleThing)
  })
})

describe('write', () => {
  it('works with files', async () => {
    const temp = path.join(__dirname, 'output', 'simple-thing.json')
    await write(simpleThing, temp)
    expect(fs.readJsonSync(temp)).toEqual(simpleThing)
  })

  it('works with stdout', async () => {
    const consoleLog = jest.spyOn(console, 'log')
    await write(simpleThing, undefined, 'json')
    expect(consoleLog).toHaveBeenCalledWith(simpleThingJson)
  })
})

test('convert', async () => {
  const inp = fixture('thing/simple/simple-thing.json')
  const out = path.join(__dirname, 'output', 'simple-thing.json')
  await convert(inp, out)
  expect(fs.readJsonSync(inp)).toEqual(fs.readJsonSync(out))
})
