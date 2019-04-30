declare module 'png-chunks-extract' {
  export type Chunk = { name: String; data: Uint8Array | Buffer }
  export default function(data: Uint8Array | Buffer): Array<Chunk>
}

declare module 'png-chunks-encode' {
  export type Chunk = { name: String; data: Uint8Array | Buffer }
  export default function(chunks: Array<Chunk>): Uint8Array
}

declare module 'png-chunk-text' {
  export type Chunk = { name: String; data: Uint8Array | Buffer }
  type Value = string | object

  export function encode(key: string, value: Value): Chunk
  export function decode(
    chunk: Uint8Array | Buffer
  ): { keyword: string; text: string }
}
