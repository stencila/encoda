import notebook from '../../__fixtures__/article/r-notebook-simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { XmdCodec } from './'
import { unlinkFiles } from '../../util/media/unlinkFiles'

const jsonCodec = new JsonCodec()
const xmdCodec = new XmdCodec()

describe('decode', () => {
  const xmdToJson = async (filename: string) =>
    await jsonCodec.dump(await xmdCodec.read(filename))

  test('basic.Rmd', async () => {
    expect(await xmdToJson(fixture('basic.Rmd'))).toMatchFile(
      snapshot('basic.json')
    )
  })

  test('kitchensink.Rmd', async () => {
    expect(await xmdToJson(fixture('kitchensink.Rmd'))).toMatchFile(
      snapshot('kitchensink.json')
    )
  })
})

describe('encode', () => {
  test('r-notebook-simple', async () => {
    expect(await xmdCodec.dump(notebook)).toMatchFile(
      snapshot('r-notebook-simple.Rmd')
    )
  })
  test('r-notebook-simple', async () => {
    expect(
      await xmdCodec.dump(
        await unlinkFiles(
          await jsonCodec.read(fixture('article/journal/elife/50356.json'))
        )
      )
    ).toMatchFile(snapshot('elife-50356.Rmd'))
  })
})
