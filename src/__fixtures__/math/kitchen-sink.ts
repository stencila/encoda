import { mathFragment, mathBlock } from '@stencila/schema'

// AsciiMath

export const asciimathString = 'E = mc^2'

export const asciimathBlock = mathBlock({
  mathLanguage: 'asciimath',
  text: asciimathString
})

export const asciimathFragment = mathFragment({
  mathLanguage: 'asciimath',
  text: asciimathString
})

// MathML

export const mathmlString =
  '<math><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></math>'

export const mathmlBlock = mathBlock({
  mathLanguage: 'mathml',
  text: mathmlString
})

export const mathmlBlockString = mathmlString.replace(
  /^<math>/,
  '<math display="block">'
)

export const mathmlFragment = mathFragment({
  mathLanguage: 'mathml',
  text: mathmlString
})

export const mathmlInlineString = mathmlString.replace(
  /^<math>/,
  '<math display="inline">'
)

// TeX

export const texString = 'E = mc^2'

export const texBlockString = `\\displaystyle ${texString}`

export const texBlock = mathBlock({
  mathLanguage: 'tex',
  text: texString
})

export const texFragment = mathFragment({
  mathLanguage: 'tex',
  text: texString
})
