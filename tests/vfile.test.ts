import { isPath } from '../src/vfile'

test('isPath', () => {
  // Directory specified, with or without file extension
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

  // Current directory
  expect(isPath('foo.txt')).toBe(true)
  expect(isPath('foo/bar.txt')).toBe(true)
  expect(isPath('a: foo')).toBe(false)
  expect(isPath('Foo bar baz')).toBe(false)

  // A file local to where tests are executed that does exist
  // but has no extension
  expect(isPath('LICENSE')).toBe(true)
})
