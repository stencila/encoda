import { VFile } from 'vfile'
import {
  Document,
  CodeChunk,
  ExecutionResultOutput,
  DisplayDataOutput,
  StreamOutput,
  ErrorOutput,
  UnknownOutput
} from '@stencila/schema'
import * as vfile from './vfile'
import { parse as mdParse } from './md'
import { Node } from './sast'

export const media = [
  'application/x-ipynb+json',

  'ipynb'
]

interface IpynbOutput {
  output_type: string
}

interface IpynbExecutionResultOutput extends IpynbOutput {
  data: Map<string, string>
  execution_count: number | null
  metadata: any
}

interface IpynbDisplayDataOutput extends IpynbOutput {
  data: Map<string, string>
  metadata: any
}

interface IpynbStreamOutput extends IpynbOutput {
  name: string
  text: Array<string>
}

interface IpynbErrorOutput extends IpynbOutput {
  ename: string
  evalue: string
  traceback: Array<string>
}

type IPYNB_OUTPUT_TYPES = IpynbExecutionResultOutput | IpynbDisplayDataOutput | IpynbStreamOutput | IpynbErrorOutput
type STENCILA_OUTPUT_TYPES = ExecutionResultOutput | DisplayDataOutput | StreamOutput | ErrorOutput

interface IpynbCell {
  cell_type: string
  source: Array<string>
  execution_count: number | null
  metadata: any,
  outputs: Array<any>
}

function parseOutputData (outputData: { [s: string]: Array<String> }): { [s: string]: string | Node } {
  for (let mimeType in outputData) {
    // getCompiler
  }

  return {
    foo: 'bar'
  }
}

function convertExecutionResult (executionResult: IpynbExecutionResultOutput): ExecutionResultOutput {
  return {
    type: 'ExecutionResultOutput',
    outputData: executionResult.data,
    executionCount: executionResult.execution_count,
    executionOutputMetadata: executionResult.metadata
  }
}

function convertDisplayData (displayData: IpynbDisplayDataOutput): DisplayDataOutput {
  return {
    type: 'DisplayDataOutput',
    outputData: displayData.data,
    executionOutputMetadata: displayData.metadata
  }
}

function convertStreamOutput (streamOutput: IpynbStreamOutput): StreamOutput {
  return {
    type: 'StreamOutput',
    outputText: streamOutput.text.join(''),
    streamName: streamOutput.name
  }
}

function convertErrorOutput (errorOutput: IpynbErrorOutput): ErrorOutput {
  return {
    type: 'ErrorOutput',
    errorName: errorOutput.ename,
    errorMessage: errorOutput.evalue,
    traceback: errorOutput.traceback.join('\n')
  }
}

function convertUnknownOutput (unknownOutput: IpynbOutput): UnknownOutput {
  return {
    type: 'UnknownOutput',
    data: unknownOutput
  }
}

function parseOutputs (outputs: Array<IPYNB_OUTPUT_TYPES>): Array<STENCILA_OUTPUT_TYPES> {
  const convertedOutputs: Array<STENCILA_OUTPUT_TYPES> = []

  for (let output of outputs) {
    if (output.output_type === 'execute_result') {
      convertedOutputs.push(convertExecutionResult(output as IpynbExecutionResultOutput))
    } else if (output.output_type === 'display_data') {
      convertedOutputs.push(convertDisplayData(output as IpynbDisplayDataOutput))
    } else if (output.output_type === 'stream') {
      convertedOutputs.push(convertStreamOutput(output as IpynbStreamOutput))
    } else if (output.output_type === 'error') {
      convertedOutputs.push(convertErrorOutput(output as IpynbErrorOutput))
    } else {
      convertedOutputs.push(convertUnknownOutput(output as IpynbOutput))
    }
  }

  return convertedOutputs
}

async function parseMarkdownCell (cell: IpynbCell) {
  const cellContent = cell.source.join('')
  const cellFile = vfile.load(cellContent)
  const convertedDocument = await mdParse(cellFile)
  if (convertedDocument.body) return convertedDocument.body
  return {}
}

function parseCodeCell (cell: IpynbCell): CodeChunk {
  const codeChunk: CodeChunk = {
    type: 'CodeChunk'
  }

  codeChunk.executionCount = cell.execution_count
  codeChunk.codeChunkMetadata = cell.metadata
  codeChunk.executionOutputs = parseOutputs(cell.outputs)
  codeChunk.sourceCode = cell.source.join('')

  return codeChunk
}

async function parseCells (cells: Array<IpynbCell>): Promise<Array<Node>> {
  const parsedCells: Array<Node> = []

  for (let cell of cells) {
    if (cell.cell_type === 'markdown') {
      parsedCells.push(await parseMarkdownCell(cell))
    } else if (cell.cell_type === 'code') {
      parsedCells.push(parseCodeCell(cell))
    } else {
      parsedCells.push({})
    }
  }

  return parsedCells
}

export async function parse (file: VFile): Promise<Node> {
  if (!file.contents) {
    throw new Error('file.contents is empty')
  }

  let doc: Document = {
    type: 'Document'
  }

  const ipynbDoc = JSON.parse(file.contents.toString())

  if (ipynbDoc.cells) {
    doc.body = await parseCells(ipynbDoc.cells)
  }

  return doc
}
