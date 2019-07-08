import { isPath } from '../vfile'

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
  // Files that exist
  expect(isPath('README.md')).toBe(true)
  expect(isPath('LICENSE')).toBe(true)
  // Files that don't
  expect(isPath('foo.txt')).toBe(false)
  expect(isPath('foo/bar.txt')).toBe(false)

  expect(isPath('a: foo')).toBe(false)
  expect(isPath('Foo bar baz')).toBe(false)
})
