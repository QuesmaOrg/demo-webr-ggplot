export interface RExample {
  id: string
  title: string
  description: string
  code: string
  csvUrl?: string // Optional URL to load CSV data
}

export interface WebRMessage {
  type: 'stdout' | 'stderr' | 'error' | 'success' | 'info' | 'warning' | 'plot'
  content: string
}

export interface CsvData {
  name: string
  content: string
  rows: number
  columns: number
  columnNames: string[]
}

// WebR output types
export interface WebRCharacterObject {
  type: 'character'
  names: string[] | null
  values: string[]
}

export interface WebRListObject {
  type: 'list'
  names: string[]
  values: WebRCharacterObject[]
}

export interface WebRProxy {
  toJs(): Promise<WebRCharacterObject | WebRListObject>
}

export interface WebROutputItem {
  type: 'stdout' | 'stderr' | 'message' | 'warning' | 'error'
  data: string | WebRProxy
}

export interface WebRExecutionResult {
  output?: WebROutputItem[]
  images?: HTMLImageElement[]
  result?: unknown
}