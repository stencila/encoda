import { create, load, dump } from '../src/vfile'
import { parse, unparse } from '../src/md'

async function around (inp: string) {
  const tree = await parse(load(inp))
  const file = create({})
  await unparse(tree, file)
  const out = dump(file)
  expect(out).toEqual(inp)
}

test('md', async () => {
  await around('A para\n')
  await around('# Heading one\n')
  await around('-   one\n-   two\n-   three\n')
})
