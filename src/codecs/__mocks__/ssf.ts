import { Node } from '@stencila/schema'
import { create, VFile } from '../../util/vfile'

export const fileNames = ['super-special-file']
export const extNames = ['ssf']
export const mediaTypes = ['application/vnd.super-corp.super-special-file']
export const sniff = async (content: string) => /^SSF:/.test(content)

// Required, but don't do anything
export const decode = async (file: VFile) => null
export const encode = async (node: Node, options: {} = {}) => create()
