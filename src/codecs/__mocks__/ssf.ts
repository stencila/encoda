/**
 * A mock codec for testing
 */

import { Node } from '@stencila/schema'
import { create, VFile } from '../../util/vfile'
import { Codec } from '../types'

export const fileNames = ['super-special-file']
export const extNames = ['ssf']
export const mediaTypes = ['application/vnd.super-corp.super-special-file']
export const sniff = async (content: string) => /^SSF:/.test(content)
export const decode = async (file: VFile) => null
export const encode = async (node: Node, options: {} = {}) => create()

export class Ssf extends Codec implements Codec {
  public fileNames = fileNames
  public extNames = extNames
  public mediaTypes = mediaTypes
  public sniff = sniff
  public decode = decode
  public encode = encode
}
