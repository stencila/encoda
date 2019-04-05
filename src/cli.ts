import yargs from 'yargs'

import { convert } from './index'

const VERSION = require('../package').version

yargs
  .scriptName('converter')

  // @ts-ignore
  .command(
    '$0 [in] [out]',
    'Convert between file formats',
    (yargs: any) => {
      yargs
        .positional('in', {
          describe: 'The input file path. Defaults to standard input.',
          type: 'string'
        })
        .positional('out', {
          describe: 'The output file path. Defaults to standard output.',
          type: 'string'
        })
        .option('from', {
          describe: 'The format to convert the input from.',
          type: 'string'
        })
        .option('to', {
          describe: 'The format to convert the output to.',
          type: 'string'
        })
    },
    async (argv: any) => {
      const inp = argv.in
      const out = argv.out
      const from = argv.from
      const to = argv.to
      console.error(`Converting from ${inp} to ${out}`)
      await convert(inp, out, from, to)
    }
  )

  // Any command-line argument given that is not demanded, or does not have a corresponding description, will be reported as an error.
  // Unrecognized commands will also be reported as errors.
  .strict()

  // Maximize width of usage instructions
  .wrap(yargs.terminalWidth())

  // Help global option
  .usage('$0 <cmd> [args]')
  .alias('help', 'h')

  // Version global option
  .version(VERSION)
  .alias('version', 'v')
  .describe('version', 'Show version')

  .parse()
