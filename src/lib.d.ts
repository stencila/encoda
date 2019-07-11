/* eslint-disable import/export */

declare module 'png-chunks-extract' {
  export interface Chunk {
    name: string
    data: Uint8Array | Buffer
  }
  export default function(data: Uint8Array | Buffer): Chunk[]
}

declare module 'png-chunks-encode' {
  export interface Chunk {
    name: string
    data: Uint8Array | Buffer
  }
  export default function(chunks: Chunk[]): Uint8Array
}

declare module 'png-chunk-text' {
  export interface Chunk {
    name: string
    data: Uint8Array | Buffer
  }
  type Value = string | object

  export function encode(key: string, value: Value): Chunk
  export function decode(
    chunk: Uint8Array | Buffer
  ): { keyword: string; text: string }
}
