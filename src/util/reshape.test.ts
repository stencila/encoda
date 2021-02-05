import { MdCodec } from '../codecs/md'
import { YamlCodec } from '../codecs/yaml'
import { fixture, nockRecord, snapshot } from '../__tests__/helpers'

const mdCodec = new MdCodec()
const yamlCodec = new YamlCodec()

test('reshape', async () => {
  const done = await nockRecord('nock-record-reshape.json')

  const reshaped = await mdCodec.read(fixture('reshape-1.md'), {
    shouldReshape: true,
  })
  expect(await yamlCodec.dump(reshaped)).toMatchFile(
    snapshot('reshape-1-reshaped.yaml')
  )
  expect(await mdCodec.dump(reshaped)).toMatchFile(
    snapshot('reshape-1-reshaped.md')
  )

  done()
})
