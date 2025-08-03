import type { WebR, Shelter, RObject } from 'webr'

// Core WebR types
export interface WebRCore {
  webR: WebR
  shelter: Shelter
}

// Output types from WebR evaluation
export interface WebROutput {
  type?: string
  data?: RObject | string
}

export interface WebRCaptureResult {
  output?: WebROutput[]
  images?: ImageBitmap[]
  result?: RObject
}

// Processed output for display
export interface ProcessedOutput {
  type: 'stdout' | 'stderr' | 'info' | 'warning' | 'error'
  content: string
}

// R object type results after toJs() conversion
export interface RCharacterVector {
  type: 'character'
  values: string[]
}

export interface RLogicalVector {
  type: 'logical'
  values: boolean[]
}

export interface RNumericVector {
  type: 'double'
  values: number[]
}

export interface RList {
  type: 'list'
  values: unknown[]
}

// Type guards for R object results
export function isRCharacterVector(obj: unknown): obj is RCharacterVector {
  return typeof obj === 'object' && 
         obj !== null && 
         'type' in obj && 
         obj.type === 'character' &&
         'values' in obj && 
         Array.isArray(obj.values)
}

export function isRLogicalVector(obj: unknown): obj is RLogicalVector {
  return typeof obj === 'object' && 
         obj !== null && 
         'type' in obj && 
         obj.type === 'logical' &&
         'values' in obj && 
         Array.isArray(obj.values)
}

export function isRNumericVector(obj: unknown): obj is RNumericVector {
  return typeof obj === 'object' && 
         obj !== null && 
         'type' in obj && 
         obj.type === 'double' &&
         'values' in obj && 
         Array.isArray(obj.values)
}

export function isRList(obj: unknown): obj is RList {
  return typeof obj === 'object' && 
         obj !== null && 
         'type' in obj && 
         obj.type === 'list' &&
         'values' in obj && 
         Array.isArray(obj.values)
}

// Execution result
export interface ExecutionResult {
  outputs: ProcessedOutput[]
  plots: string[]
  duration: number
  success: boolean
}

// Package info
export interface PackageInfo {
  name: string
  version: string
}

// File upload result
export interface FileUploadResult {
  path: string
  name: string
}