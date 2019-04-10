import { dump, handled, load, match } from '../src'
import * as json from '../src/json'
import * as yaml from '../src/yaml'

test('match', async () => {
  expect(await match('file.json')).toEqual(json)
  expect(await match('dir/file.json')).toEqual(json)
  expect(await match('file.foo', 'json')).toEqual(json)
  expect(await match('file.foo', 'application/json')).toEqual(json)
  expect(await match(undefined, 'application/json')).toEqual(json)
  await expect(match('foo.bar')).rejects.toThrow(
    'No compiler could be found for file path "foo.bar".'
  )
  await expect(match(undefined, 'foo')).rejects.toThrow(
    'No compiler could be found for media type "foo".'
  )

  expect(await match('file.yaml')).toEqual(yaml)
  expect(await match('file.yml')).toEqual(yaml)
  expect(await match(undefined, 'yaml')).toEqual(yaml)
  expect(await match(undefined, 'yml')).toEqual(yaml)
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
