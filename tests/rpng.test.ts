import fs from 'fs'
import path from 'path'
import { extract, insert, parse, sniff, unparse } from '../src/rpng'
import { read } from '../src/vfile'
import vfile = require('vfile')

const rpngPath = path.join(__dirname, 'fixtures', 'rpng', 'rpng.png')

const node = {
  type: 'Paragraph',
  content: 'The JSON extracted from the rPNG TEXt chunk'
}

test('sniff', () => {
  expect(sniff(rpngPath)).toBeTruthy()
  expect(sniff('/some/file.zip')).toBeFalsy()
})

test('parse', async () => {
  const file = await read(rpngPath)
  expect(await parse(file)).toEqual(node)
})

test('can insert an object into an image and then re-extract it', () => {
  let image = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'rpng', 'rpng.png')
  )

  function check(node: any) {
    image = insert(node, image)
    expect(extract(image)).toEqual(node)
  }

  // Simple values...

  check({})
  check({ value: 42 })
  check({ value: true })
  check({ value: [1, 2, 3, 4] })

  // And something a little more complicated which is similar to what we may want to
  // embed in a doc

  check({
    type: 'Expression',
    lang: 'python',
    code: 'sum(data)'
  })

  check({
    type: 'Chunk',
    lang: 'r',
    code: 'ggplot(data) + geom_point(x=year, y=weight, color=gender)'
  })

  fs.writeFileSync(
    path.join(__dirname, 'fixtures', 'rpng', 'rpng-out.png'),
    image
  )
})

test('unparse', async () => {
  expect(
    await unparse({
      node
    })
  ).toBeInstanceOf(vfile)
})
