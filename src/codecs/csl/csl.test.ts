import path from 'path'
import { CSLCodec } from '.'
import * as vfile from '../../util/vfile'
import { YamlCodec } from '../yaml'

const yaml = new YamlCodec()

const { encode, decode } = new CSLCodec()

const fixture = (name: string) => path.join(__dirname, '__fixtures__', name)

const snapshot = (name: string) =>
  path.join(__dirname, '__file_snapshots__', name)

test('decode', async () => {
  const csl2yaml = async (name: string) =>
    vfile.dump(await yaml.encode(await decode(await vfile.read(fixture(name)))))

  expect(await csl2yaml('10.5334-jors-182.csl.json')).toMatchFile(
    snapshot('10.5334-jors-182.yaml')
  )
})

test('encode', async () => {
  const yaml2csl = async (name: string) =>
    vfile.dump(await encode(await yaml.decode(await vfile.read(fixture(name)))))

  expect(await yaml2csl('article.yaml')).toMatchFile(
    snapshot('article.csl.json')
  )
})
