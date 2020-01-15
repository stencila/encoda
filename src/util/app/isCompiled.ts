/**
 * Is this application being run as Javascript (i.e. using `node`),
 * rather than as Typescript (i.e. using `ts-node`)?
 *
 * @module util/app/isCompiled
 */

const isCompiled = __filename.endsWith('.js')
export default isCompiled
