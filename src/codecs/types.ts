import * as stencila from '@stencila/schema'
import { EncodeOptions } from '..'
import { VFile } from '../util/vfile'

/**
 * The interface for a codec.
 *
 * A codec is simply a module with these constants
 * and functions (some of which are optional).
 *
 * Note that our use of the term "codec", is consistent with our usage elsewhere in Stencila
 * as something that creates or modifies executable document, and
 * differs from the usage of [`unified`](https://github.com/unifiedjs/unified#processorcodec).
 */
export interface Codec<CodecOptions extends object = {}> {
  /**
   * An array of [IANA Media Type](https://www.iana.org/assignments/media-types/media-types.xhtml)
   * that the codec can decode/encode.
   */
  mediaTypes: string[]

  /**
   * Any array of file names to use to match the codec.
   * This can be useful for differentiating between
   * "flavors" of formats e.g. `datapackage.json` versus any old `.json` file.
   */
  fileNames?: string[]

  /**
   * Any array of file name extensions to register for the codec.
   * This can be useful for specifying conversion to less well known media types
   * e.g. `--to tdp` for outputting `datapackage.json` to the console.
   */
  extNames?: string[]

  /**
   * A function that does [content sniffing](https://en.wikipedia.org/wiki/Content_sniffing)
   * to determine if the codec is able to decode the content. As well as raw content, the content
   * string could be a file system path and the codec could do "sniffing" of the file system
   * (e.g. testing if certain files are present in a directory).
   */
  sniff?: (content: string) => Promise<boolean>

  /**
   * Decode a `VFile` to a `stencila.Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a `stencila.Node`
   */
  decode: (file: VFile) => Promise<stencila.Node>

  /**
   * Encode a `stencila.Node` to a `VFile`.
   *
   * @param node The `stencila.Node` to encode
   * @param options An optional object allowing for passing extra options and parameters to various codecs.
   * @returns A promise that resolves to a `VFile`
   */
  encode: (
    node: stencila.Node,
    options?: EncodeOptions<CodecOptions>
  ) => Promise<VFile>
}

export type Encode<Options extends object = {}> = Codec<Options>['encode']
export type CustomCodec<Options extends EncodeOptions = {}> = (
  node: stencila.Node,
  options?: Options
) => Promise<VFile>
