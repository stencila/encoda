import { toMatchFile } from 'jest-file-snapshot';
import path from 'path'
import { decode, encode } from '.'
import * as yaml from '../yaml'
import * as vfile from '../../util/vfile'

const fixture = (name: string) =>
  path.join(__dirname, '__fixtures__', name)

const snapshot = (name: string) =>
  path.join(__dirname, '__file_snapshots__', name)

test('decode', async () => {
  const bib2yaml = async (name: string) =>
    vfile.dump(await yaml.encode(await decode(await vfile.read(fixture(name)))))

  expect(await bib2yaml('small.bib')).toMatchFile(snapshot('small.yaml'))
})

test('encode', async () => {
  const yaml2bib = async (name: string) =>
    vfile.dump(await encode(await yaml.decode(await vfile.read(fixture(name)))))

  expect(await yaml2bib('article.yaml')).toMatchFile(snapshot('article.bib'))
})
