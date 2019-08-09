import { elem, dump, Element } from './xml'

test('elem', () => {
  expect(elem('tag')).toEqual({
    type: 'element',
    name: 'tag',
    attributes: {},
    elements: []
  })

  expect(elem('tag', { foo: 'bar' })).toEqual({
    type: 'element',
    name: 'tag',
    attributes: { foo: 'bar' },
    elements: []
  })

  expect(elem('parent', elem('child'))).toEqual({
    type: 'element',
    name: 'parent',
    attributes: {},
    elements: [
      {
        type: 'element',
        name: 'child',
        attributes: {},
        elements: []
      }
    ]
  })

  expect(elem('parent', 'foo')).toEqual({
    type: 'element',
    name: 'parent',
    attributes: {},
    elements: [
      {
        type: 'text',
        text: 'foo'
      }
    ]
  })
})

test('dump', () => {
  const frag = (el: Element) => {
    return dump({ elements: [el] })
  }

  expect(frag(elem('tag'))).toEqual(`<tag/>`)

  expect(frag(elem('tag', { foo: 'bar' }))).toEqual(`<tag foo="bar"/>`)

  expect(frag(elem('parent', { foo: 'bar' }, elem('child')))).toEqual(
    `<parent foo="bar"><child/></parent>`
  )
})
