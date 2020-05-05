import * as stencila from '@stencila/schema'
import * as vfile from '../util/vfile'
import { toFiles } from '../util/media/toFiles'
import { fromFiles } from '../util/media/fromFiles'
import { resolveFiles } from '../util/media/resolveFiles'
/**
 * Encoding options that are common to all codecs.
 *
 * Codecs are encouraged to respect these options but
 * are not forced to. Indeed, some options do not make sense for
 * some codecs. For example, for the PDF codec `isStandalone`
 * is always `true` so if `isStandalone: false` is supplied
 * as an option it will be ignored. Futhermore, some combinations
 * of options are pointless e.g. a `theme` when `isStandalone: false`
 */
export interface CommonEncodeOptions {
  format?: string
  filePath?: string
  isStandalone?: boolean
  isBundle?: boolean
  shouldZip?: 'yes' | 'no' | 'maybe'
  theme?: string
}

/**
 * Default values for encoding options.
 *
 * This set of defaults provide a way of promoting consistency amongst
 * codecs. Instead of, for example, one codec defaulting
 * to `isStandalone: true` and another to `false`. It does not
 * enforce consistency however.
 */
type CommonEncodeDefaults = Required<
  Pick<CommonEncodeOptions, 'isStandalone' | 'isBundle' | 'shouldZip' | 'theme'>
>
export const commonEncodeDefaults: CommonEncodeDefaults = {
  isStandalone: false,
  isBundle: false,
  shouldZip: 'no',
  theme: 'stencila',
}

/**
 * Decoding options that are common to all codecs.
 *
 * See notes for `CommonEncodeOptions` for how these are used.
 */
export interface CommonDecodeOptions {
  /**
   * The format to decode content from.
   *
   * Most codecs only decode from one format. However,
   * for those codecs that support multiple formats,
   * this options lets the user specify which one.
   */
  format?: string

  /**
   * Should the content be treated as a standalone
   * document or as a fragment?
   *
   * This option affects whether codecs will attempt
   * to extract metadata etc from the content. If this
   * option is `false`, some codecs will default to returning
   * an array of content nodes, instead of for example an
   * `Article` node.
   */
  isStandalone?: boolean

  /**
   * The node type to decode content to.
   *
   * Many codecs decode to a single node type.
   * e.g. the `docx` codec always decodes to an `Article`.
   * However, some `codecs` can decode to multiple node types.
   * e.g. the `yaml` and `xlsx` codecs.
   * This option allows the user to be explicit about which node type
   * they expect content to be decode to.
   */
  asType?: keyof stencila.Types
}

/**
 * Default values for encoding options.
 *
 * See notes for `commonEncodeDefaults` for why these exist.
 */
type CommonDecodeDefaults = Required<Pick<CommonDecodeOptions, 'isStandalone'>>
export const commonDecodeDefaults: CommonDecodeDefaults = {
  // To avoid breaking changes this is true, but may be changed to
  // false for consistency with default for encoding (false)
  isStandalone: true,
}

/**
 * The interface for a codec.
 *
 * Note that our use of the term "codec", is consistent with our usage elsewhere in Stencila
 * as something that creates or modifies executable document, and
 * differs from the usage of [`unified`](https://github.com/unifiedjs/unified#processorcodec).
 */
export abstract class Codec<
  EncodeOptions extends CommonEncodeOptions = {},
  DecodeOptions extends CommonDecodeOptions = {}
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
   * The default encode options for this codec
   */
  protected commonEncodeDefaults: CommonEncodeDefaults = commonEncodeDefaults

  /**
   * The default decode options for this codec
   */
  protected commonDecodeDefaults: CommonDecodeDefaults = commonDecodeDefaults

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

  /**
   * Encode a `stencila.Node` to a `VFile`.
   *
   * @param node The `stencila.Node` to encode
   * @param options Encoding options
   * @returns A promise that resolves to a `VFile`
   */
  public abstract readonly encode: (
    node: stencila.Node,
    options?: EncodeOptions
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
  public async load(
    content: string,
    options?: DecodeOptions
  ): Promise<stencila.Node> {
    return this.decode(vfile.load(content), options)
  }

  /**
   * Transform a node prior to dumping it.
   *
   * Defaults to "bundling" the file i.e reading
   * media content from files into data URIs.
   * This default can be overridden using the `isBundle: false` option
   * but is usually appropriate for `dump`ing to a string (cf `write` which
   * writes to files).
   * Derived classes may override this method to perform alternative
   * transformations to the node, prior to dumping it.
   *
   * @param node The `stencila.Node` to write
   * @param filePath The path of the file
   * @param options Encoding options
   */
  public preDump(
    node: stencila.Node,
    options?: EncodeOptions
  ): Promise<stencila.Node> {
    const { isBundle = true } = { ...options }
    return isBundle ? fromFiles(node) : Promise.resolve(node)
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
  public async dump(
    node: stencila.Node,
    options?: EncodeOptions
  ): Promise<string> {
    return vfile.dump(
      await this.encode(await this.preDump(node, options), options)
    )
  }

  /**
   * Read a `stencila.Node` from a file.
   *
   * This is a convenience method which reads the file into a `VFile`,
   * makes any references to local files absolute, and passes
   * it to the `decode` method.
   *
   * @param filePath The path of the file
   * @param options Decoding options
   * @returns A promise that resolves to a `stencila.Node`
   */
  public async read(
    filePath: string,
    options?: DecodeOptions
  ): Promise<stencila.Node> {
    const node = await this.decode(await vfile.read(filePath), options)
    return resolveFiles(node, filePath)
  }

  /**
   * Transform a node after reading it.
   *
   * Makes any references to local files absolute.
   * Derived classes may override this method to perform alternative
   * transformations to the node, prior to writing it.
   *
   * @param node The `stencila.Node` to transform
   * @param filePath The path of the file
   * @param options Decoding options
   * @returns A promise that resolves to a `stencila.Node`
   */
  public postRead(
    node: stencila.Node,
    filePath: string,
    options?: DecodeOptions
  ): Promise<stencila.Node> {
    return Promise.resolve(resolveFiles(node, filePath))
  }

  /**
   * Transform a node prior to writing it.
   *
   * Writes data URI or file system media content to a sibling folder.
   * This default behavior can be overridden using the `isBundle: true`
   * option, but is usually appropriate for `write`ing files (cf `dump`
   * which bundles them.
   * Derived classes may override this method to perform alternative
   * transformations to the node, prior to writing it.
   *
   * @param node The `stencila.Node` to write
   * @param filePath The path of the file
   * @param options Encoding options
   */
  public preWrite(
    node: stencila.Node,
    filePath: string,
    options?: EncodeOptions
  ): Promise<stencila.Node> {
    const { isBundle = false } = { ...options }
    return isBundle
      ? fromFiles(node)
      : toFiles(node, filePath, ['data', 'file'])
  }

  /**
   * Encode a `stencila.Node` to a file
   *
   * This is a convenience method which writes the content of the `VFile` created by
   * the `encode` method.
   *
   * @param node The `stencila.Node` to write
   * @param filePath The path of the file
   * @param options Encoding options
   */
  public async write(
    node: stencila.Node,
    filePath: string,
    options?: EncodeOptions
  ): Promise<void> {
    return vfile.write(
      await this.encode(await this.preWrite(node, filePath, options), {
        filePath,
        ...options,
      } as EncodeOptions),
      filePath
    )
  }
}
