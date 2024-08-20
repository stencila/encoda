import { elem, dump, Element, firstByType, load } from './xml'

test('elem', () => {
  expect(elem('tag')).toEqual({
    type: 'element',
    name: 'tag',
    attributes: {},
    elements: [],
  })

  expect(elem('tag', { foo: 'bar' })).toEqual({
    type: 'element',
    name: 'tag',
    attributes: { foo: 'bar' },
    elements: [],
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
        elements: [],
      },
    ],
  })

  expect(elem('parent', 'foo')).toEqual({
    type: 'element',
    name: 'parent',
    attributes: {},
    elements: [
      {
        type: 'text',
        text: 'foo',
      },
    ],
  })
})

test('dump', () => {
  const frag = (el: Element) => {
    return dump({ elements: [el] })
  }

  expect(frag(elem('tag'))).toEqual(`<tag/>`)

  expect(frag(elem('tag', { foo: 'bar' }))).toEqual(`<tag foo="bar"/>`)

  expect(frag(elem('parent', { foo: 'bar' }, elem('child')))).toEqual(
    `<parent foo="bar"><child/></parent>`,
  )
})

describe('firstByType', () => {
  const xml = load(`
  <contrib contrib-type="author" corresp="yes">
    <email>some@email.io</email>
    <email>another@email.com</email>
    <collab>This is an Org name
      <contrib-group>
        <contrib>
          <name>
            <surname>Test</surname>
            <given-names>Name</given-names>
          </name>
        </contrib>
      </contrib-group>
    </collab>
  </contrib>`)

  it('gets an element', () => {
    expect(firstByType(xml, 'element')).toEqual(xml.elements![0])
  })

  it('gets a text element', () => {
    const match = firstByType(xml, 'text')
    expect(match).toHaveProperty('type', 'text')
    expect(match).toHaveProperty('text', 'some@email.io')
  })
})
