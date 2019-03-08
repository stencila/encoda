import { load, dump } from '../src/vfile'
import { parse, unparse } from '../src/commonmark'

async function around (inp: string) {
  const tree = await parse(load(inp))
  const out = dump(await unparse(tree))
  expect(out).toEqual(inp)
}

test('commonmark', async () => {
  await around('A para\n')
  await around('# Heading one\n')
  await around('-   one\n-   two\n-   three\n')
})
