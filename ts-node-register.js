// A hook to register `ts-node` with the `--files`
// option when using it for the `npm run repl:debug`
// script.
// See https://stackoverflow.com/questions/51610583/ts-node-ignores-d-ts-files-while-tsc-successfully-compiles-the-project#comment90321934_51666714
require('ts-node').register({ files: true })
