import {
  Listener,
  // TODO: Now that Executa re-exports logga
  // and schema, shall we use those instead of
  // potentially having version conflicts
  logga,
  schema,
  Server,
  StdioServer,
  Capabilities
} from '@stencila/executa'
import { dump, load } from '.'

const log = logga.getLogger('encoda')

/**
 * An Executa `Listener` which by default listens
 * on `stdio` to expose the `decode` and `encode`
 * functions.
 */
export class Encoda extends Listener {
  constructor(
    servers: Server[] = [
      new StdioServer({ command: 'node', args: [__filename] })
    ]
  ) {
    super('en', servers)
  }

  /**
   * Register Encoda so that it can
   * be discovered by other executors.
   */
  public async register(): Promise<void> {
    StdioServer.register('encoda', await this.manifest())
  }

  /**
   * @override Override of `Executor.capabilities` to
   * define Encoda specific capabilities.
   */
  public capabilities(): Promise<Capabilities> {
    return Promise.resolve({
      manifest: true,
      // TODO: Populate these with formats available
      decode: true,
      encode: true
    })
  }

  /**
   * @override Override of `Executor.decode` to call the `load`
   * function (which decodes from a string to a `Node`)
   */
  public async decode(content: string, format: string): Promise<schema.Node> {
    return load(content, format)
  }

  /**
   * @override Override of `Executor.encode` to call the `dump`
   * function (which encodes a `Node` to a string)
   */
  public async encode(node: schema.Node, format: string): Promise<string> {
    return dump(node, format)
  }
}

/**
 * Create an `Encoda` and run one of it's methods.
 *
 * Used by `npm postinstall` to register this interpreter,
 * and below, to start it.
 *
 * @param method The name of the method to run
 */
// TODO: This is ported from Basha. If it is
// a generally useful approach then we could make this
// a generic in Executa so that it does not need to be duplicated.
export const run = (method: string): void => {
  const instance = new Encoda()
  /* eslint-disable @typescript-eslint/unbound-method */
  const func = method === 'register' ? instance.register : instance.start
  func.apply(instance).catch(error => log.error(error))
}

// Default to running `start`
if (require.main === module) run('start')
