import { dump, handled, load, resolve } from '../src'
import * as json from '../src/json'
import * as yaml from '../src/yaml'

test('resolve', async () => {
  expect(await resolve('file.json')).toEqual(json)
  expect(await resolve('dir/file.json')).toEqual(json)
  expect(await resolve('file.foo', 'json')).toEqual(json)
  expect(await resolve('file.foo', 'application/json')).toEqual(json)
  expect(await resolve(undefined, 'application/json')).toEqual(json)
  await expect(resolve('foo.bar')).rejects.toThrow(
    'No compiler could be found for file path "foo.bar".'
  )
  await expect(resolve(undefined, 'foo')).rejects.toThrow(
    'No compiler could be found for media type "foo".'
  )

  expect(await resolve('file.yaml')).toEqual(yaml)
  expect(await resolve('file.yml')).toEqual(yaml)
  expect(await resolve(undefined, 'yaml')).toEqual(yaml)
  expect(await resolve(undefined, 'yml')).toEqual(yaml)
})

test('handle', async () => {
  expect(await handled('file.json')).toBeTruthy()
  expect(await handled(undefined, 'json')).toBeTruthy()
  expect(await handled(undefined, 'application/json')).toBeTruthy()

  expect(await handled('file.foo')).toBeFalsy()
  expect(await handled(undefined, 'foo')).toBeFalsy()
  expect(await handled(undefined, 'application/foo')).toBeFalsy()
})

test('load', async () => {
  expect(await load('{"type":"Thing"}', 'json')).toEqual({ type: 'Thing' })
})

test('dump', async () => {
  expect(await dump({ type: 'Thing' }, 'json')).toEqual(
    '{\n  "type": "Thing"\n}'
  )
})
