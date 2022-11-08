/* eslint-disable import/export */

declare module 'asciimath2tex' {
  export default class AsciiMathParser {
    parse(asciimath: string): string
  }
}

declare module 'png-chunks-extract' {
  export interface Chunk {
    name: string
    data: Uint8Array | Buffer
  }
  export default function (data: Uint8Array | Buffer): Chunk[]
}

declare module 'png-chunks-encode' {
  export interface Chunk {
    name: string
    data: Uint8Array | Buffer
  }
  export default function (chunks: Chunk[]): Uint8Array
}

declare module 'png-chunk-text' {
  export interface Chunk {
    name: string
    data: Uint8Array | Buffer
  }
  type Value = string | object

  export function encode(key: string, value: Value): Chunk
  export function decode(chunk: Uint8Array | Buffer): {
    keyword: string
    text: string
  }
}

declare module 'length-prefixed-stream' {
  import stream from 'stream'

  export type Encoder = stream.Transform
  export type Decoder = stream.Transform

  export function encode(): Encoder
  export function decode(): Decoder
}
