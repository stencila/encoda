import yargs from 'yargs'
import './boot'
import { devserve } from './devserve'
import { convert } from './index'

const VERSION = require('../package').version

yargs
  .scriptName('stencila-convert')

  // @ts-ignore
  .command(
    '$0 [in] [out]',
    'Convert between file formats',
    // @ts-ignore
    (yargs: any) => {
      yargs
        .positional('in', {
          describe: 'The input file path. Defaults to standard input.',
          type: 'string',
          default: '-'
        })
        .positional('out', {
          describe: 'The output file path. Defaults to standard output.',
          type: 'string',
          default: '-'
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
      await convert(inp, out, { from, to })
    }
  )

  .command(
    'devserve [dir]',
    'Serve a directory in development mode (watches for changes in files and automatically syncs the browser)',
    (yargs: any) => {
      yargs.positional('dir', {
        describe: 'The directory to serve. Defaults to current.',
        type: 'string',
        default: '.'
      })
    },
    async (argv: any) => {
      devserve(argv.dir)
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
