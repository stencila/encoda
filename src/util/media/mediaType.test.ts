import { mediaType } from './mediaType'

test('urls', () => {
  expect(mediaType('http://example.com/foo.png')).toBe('image')
  expect(mediaType('http://example.com/foo.mpeg?time=4.5s')).toBe('video')
})

test('file paths', () => {
  expect(mediaType('foo.png')).toBe('image')
  expect(mediaType('../a/sub/folder/foo.mpeg')).toBe('video')
  expect(mediaType('looks.like.domain/foo.jpg')).toBe('image')
})

test('fallback', () => {
  expect(mediaType('foo')).toBe('image')
  expect(mediaType('foo.bar')).toBe('image')
  expect(mediaType('foo.bar', 'video')).toBe('video')
})
