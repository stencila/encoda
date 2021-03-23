import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { NwCodec } from './'

const jsonCodec = new JsonCodec()
const nwCodec = new NwCodec()

describe('fixtures', () => {
  test('python.nw', async () => {
    const node = await nwCodec.read(fixture('python.nw'))
    expect(await jsonCodec.dump(node)).toMatchFile(snapshot('python.json'))
  })

  test('r.Rnw', async () => {
    const node = await nwCodec.read(fixture('r.Rnw'))
    expect(await jsonCodec.dump(node)).toMatchFile(snapshot('r.json'))
  })
})
