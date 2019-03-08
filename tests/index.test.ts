import { resolve } from '../src'
import { create } from '../src/vfile'

test('resolve', async () => {
  await expect(
    resolve(create({
      mimeType: 'foo'
    }))
  ).rejects.toThrow(
    'No compiler could be found for file undefined'
  )
})
