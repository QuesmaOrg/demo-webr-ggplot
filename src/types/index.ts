export interface RExample {
  id: string
  title: string
  description: string
  code: string
}

export interface WebRMessage {
  type: 'stdout' | 'stderr' | 'error' | 'success'
  content: string
}

export interface CsvData {
  name: string
  content: string
}