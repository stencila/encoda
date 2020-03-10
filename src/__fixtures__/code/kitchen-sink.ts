import { codeExpression, codeChunk } from '@stencila/schema'

export const rCodeExpression = codeExpression({
  programmingLanguage: 'r',
  text: '6 * 7',
  output: 42
})

export const rCodeExpressionNoOutput = codeExpression({
  programmingLanguage: 'r',
  text: ''
})

export const pythonCodeChunk = codeChunk({
  programmingLanguage: 'python',
  text: 'import datetime\ndatetime.datetime.now()',
  outputs: ['datetime.datetime(2020, 3, 10, 18, 24, 28, 589631)']
})
