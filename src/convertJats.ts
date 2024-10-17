#!/usr/bin/env node

import { convert } from './index'

// Convert JATS from stdin and return JSON to console.log
convert('-', undefined, {
  from: 'jats',
  to: 'json',
  encodeOptions: {
    isBundle: false,
  },
  decodeOptions: {
    shouldReshape: false,
  },
})
  .then((conversion) => conversion ?? '{}')
  .then((conversion) => conversion.replaceAll(`${process.cwd()}/`, ''))
  .then((conversion) => console.log(conversion))
  .catch((error) => {
    console.error('Error during conversion:', error)
    process.exit(1)
  })
