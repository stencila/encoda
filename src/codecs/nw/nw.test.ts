import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { NwCodec } from './' // './' means the index.ts file

const jsonCodec = new JsonCodec()
const nwCodec = new NwCodec()

describe('fixtures', () => {
  test('python.nw', async () => {
    const node = await nwCodec.read(fixture('python.nw'), {
      shouldCoerce: false,
      shouldReshape: false,
    })
    expect(await jsonCodec.dump(node)).toMatchFile(snapshot('python.json'))
  })

  test('python.nw', async () => {
    const node = await nwCodec.read(fixture('python.nw'))
    expect(await jsonCodec.dump(node)).toMatchFile(snapshot('python.json'))
  })
})
