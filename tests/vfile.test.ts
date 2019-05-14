import { isPath } from '../src/vfile'

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
