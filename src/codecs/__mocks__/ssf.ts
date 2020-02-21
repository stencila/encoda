/**
 * A mock codec for testing
 */

import { Node } from '@stencila/schema'
import { create, VFile } from '../../util/vfile'
import { Codec, commonEncodeDefaults } from '../types'

export const fileNames = ['super-special-file']
export const extNames = ['ssf']
export const mediaTypes = ['application/vnd.super-corp.super-special-file']
export const sniff = async (content: string) => /^SSF:/.test(content)
export const decode = async (file: VFile) => null
export const encode = async (node: Node, options: {} = commonEncodeDefaults) =>
  create()

export class SsfCodec extends Codec implements Codec {
  public readonly fileNames = fileNames
  public readonly extNames = extNames
  public readonly mediaTypes = mediaTypes
  public readonly sniff = sniff
  public readonly decode = decode
  public readonly encode = encode
}
