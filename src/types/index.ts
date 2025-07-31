export interface RExample {
  id: string
  title: string
  description: string
  code: string
  csvUrl?: string // Optional URL to load CSV data
}

export interface WebRMessage {
  type: 'stdout' | 'stderr' | 'error' | 'success' | 'info' | 'plot'
  content: string
}

export interface CsvData {
  name: string
  content: string
  rows: number
  columns: number
  columnNames: string[]
}