import {
  codeExpression,
  codeChunk,
  imageObject,
  codeError,
} from '@stencila/schema'

export const rCodeExpression = codeExpression({
  programmingLanguage: 'r',
  text: '6 * 7',
  output: 42,
})

export const rCodeExpressionNoOutput = codeExpression({
  programmingLanguage: 'r',
  text: '',
})

export const rCodeExpressionError = codeExpression({
  programmingLanguage: 'r',
  text: 'foo',
  errors: [codeError({ errorMessage: "object 'foo' not found" })],
})

export const pythonCodeChunk = codeChunk({
  programmingLanguage: 'python',
  text: 'import datetime\ndatetime.datetime.now()',
  outputs: ['datetime.datetime(2020, 3, 10, 18, 24, 28, 589631)'],
})

export const rCodeChunkImageOutput = codeChunk({
  programmingLanguage: 'r',
  text: 'plot(1:10)\n',
  outputs: [
    imageObject({
      contentUrl:
        'data:image/png;base64,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',
    }),
  ],
})

export const rCodeChunkNoOutput = codeChunk({
  programmingLanguage: 'r',
  text: '# Just a comment\n',
})

export const rCodeChunkError = codeChunk({
  programmingLanguage: 'r',
  text: 'foo',
  errors: [codeError({ errorMessage: "object 'foo' not found" })],
})
