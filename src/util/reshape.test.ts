import { MdCodec } from '../codecs/md'
import { fixture, nockRecord, snapshot } from '../__tests__/helpers'

const mdCodec = new MdCodec()

test('reshape', async () => {
  const done = await nockRecord('nock-record-reshape.json')

  expect(
    await mdCodec.dump(
      await mdCodec.read(fixture('reshape-1.md'), { shouldReshape: true })
    )
  ).toMatchFile(snapshot('reshape-1-reshaped.md'))

  done()
})
