import { truncate } from './truncate'

const text =
  'On the 24th of February, 1815, the look-out at Notre-Dame de la Garde signalled the three-master, the Pharaon from Smyrna, Trieste, and Naples.'

describe('Truncate strings', () => {
  test('it does not truncate text equal to maxLength in length', () => {
    expect(truncate(text, text.length)).toBe(text)
  })

  test('it does not truncate text below maxLength in length', () => {
    expect(truncate(text, text.length + 1)).toBe(text)
  })

  test('it truncates text to fit within maxLength', () => {
    expect(truncate(text, 10)).toHaveLength(10)
  })
})
