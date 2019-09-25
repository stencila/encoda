import * as stencila from '@stencila/schema'
import { getTheme, ThemeNames } from '@stencila/thema'
import * as vfile from '../util/vfile'

export interface GlobalEncodeOptions<CodecOptions extends object = {}> {
  format?: string
  filePath?: string
  isStandalone?: boolean
  isBundle?: boolean
  shouldZip?: 'yes' | 'no' | 'maybe'
  theme: ThemeNames

  codecOptions?: CodecOptions
}

export const defaultEncodeOptions: GlobalEncodeOptions = {
  shouldZip: 'no',
  theme: getTheme()
}

/**
 * The interface for a codec.
 *
 * Note that our use of the term "codec", is consistent with our usage elsewhere in Stencila
 * as something that creates or modifies executable document, and
 * differs from the usage of [`unified`](https://github.com/unifiedjs/unified#processorcodec).
 */
export abstract class Codec<
  EncodeOptions extends object = {},
  DecodeOptions extends object = {}
> {
  /**
   * An array of [IANA Media Type](https://www.iana.org/assignments/media-types/media-types.xhtml)
   * that the codec can decode/encode.
   */
  public readonly mediaTypes?: string[]

  /**
   * Any array of file names to use to match the codec.
   * This can be useful for differentiating between
   * "flavors" of formats e.g. `datapackage.json` versus any old `.json` file.
   */
  public readonly fileNames?: string[]

  /**
   * Any array of file name extensions to register for the codec.
   * This can be useful for specifying conversion to less well known media types
   * e.g. `--to tdp` for outputting `datapackage.json` to the console.
   */
  public readonly extNames?: string[]

  /**
   * A function that does [content sniffing](https://en.wikipedia.org/wiki/Content_sniffing)
   * to determine if the codec is able to decode the content. As well as raw content, the content
   * string could be a file system path and the codec could do "sniffing" of the file system
   * (e.g. testing if certain files are present in a directory).
   */
  public readonly sniff?: (content: string) => Promise<boolean>

  /**
   * Decode a `VFile` to a `stencila.Node`.
   *
   * @param file The `VFile` to decode
   * @param options Decoding options
   * @returns A promise that resolves to a `stencila.Node`
   */
  public abstract readonly decode: (
    file: vfile.VFile,
    options?: DecodeOptions
  ) => Promise<stencila.Node>

  protected defaultEncodeOptions = defaultEncodeOptions

  /**
   * Encode a `stencila.Node` to a `VFile`.
   *
   * @param node The `stencila.Node` to encode
   * @param options Encoding options
   * @returns A promise that resolves to a `VFile`
   */
  public abstract readonly encode: (
    node: stencila.Node,
    options?: EncodeOptions & GlobalEncodeOptions
  ) => Promise<vfile.VFile>

  /**
   * Decode a `stencila.Node` from a `string`.
   *
   * This is a convenience method which simply
   * reads the content of the `VFile` and passes
   * it to the `decode` method.
   *
   * @param content The `string` to decode
   * @param options Decoding options
   * @returns A promise that resolves to a `stencila.Node`
   */
  public async load(content: string, options?: DecodeOptions): Promise<stencila.Node> {
    return this.decode(vfile.load(content), options)
  }

  /**
   * Encode a `stencila.Node` to a `string`.
   *
   * This is a convenience method which simply
   * dumps the content of the `VFile` created by
   * the `encode` method.
   *
   * @param node The `stencila.Node` to dump
   * @returns A promise that resolves to a `string`
   */
  public async dump(node: stencila.Node, options?: EncodeOptions & GlobalEncodeOptions): Promise<string> {
    return vfile.dump(await this.encode(node, options))
  }
}
