import type { WebR } from 'webr'
import type { FileUploadResult } from '../core/types'
import { sanitizeFilename, sanitizeRVariableName } from '../utils/validators'
import { withErrorHandling } from '../utils/errors'

/**
 * Manages file operations in WebR's virtual filesystem
 * @see https://docs.r-wasm.org/webr/latest/mounting.html
 */
export class FileSystem {
  private uploadedFiles = new Set<string>()
  private readonly UPLOAD_DIR = '/tmp'

  constructor(private webR: WebR) {}

  /**
   * Upload CSV content to WebR filesystem
   * @see https://docs.r-wasm.org/webr/latest/api/js/interfaces/WebR.FS.html
   */
  async uploadCsv(content: string, filename: string): Promise<FileUploadResult> {
    return withErrorHandling(async () => {
      const safeFilename = sanitizeFilename(filename)
      const filePath = `${this.UPLOAD_DIR}/${safeFilename}`

      // Convert string to bytes
      const csvBytes = new TextEncoder().encode(content)
      
      // Write file to WebR filesystem
      await this.webR.FS.writeFile(filePath, csvBytes)
      
      // Track uploaded file
      this.uploadedFiles.add(safeFilename)
      
      return {
        path: filePath,
        name: safeFilename
      }
    }, `Failed to upload ${filename}`)
  }

  /**
   * Load CSV file into R variable
   */
  async loadCsvToR(filePath: string, varName?: string): Promise<string> {
    const safeVarName = varName 
      ? sanitizeRVariableName(varName) 
      : 'data'

    return withErrorHandling(async () => {
      // Load CSV with proper options
      await this.webR.evalR(`
        ${safeVarName} <- read.csv(
          "${filePath}", 
          stringsAsFactors = FALSE, 
          header = TRUE
        )
      `)
      
      // Get basic info about loaded data
      const infoResult = await this.webR.evalR(`
        paste0(
          "Loaded ", nrow(${safeVarName}), " rows and ", 
          ncol(${safeVarName}), " columns"
        )
      `)
      
      const info = await infoResult.toJs()
      const infoMessage = info?.values?.[0] || 'Data loaded'
      
      return infoMessage
    }, `Failed to load ${filePath} into R`)
  }

  /**
   * Upload CSV and immediately load into R
   */
  async uploadAndLoad(
    content: string, 
    filename: string, 
    varName?: string
  ): Promise<{ file: FileUploadResult; message: string }> {
    const file = await this.uploadCsv(content, filename)
    const message = await this.loadCsvToR(file.path, varName)
    
    return { file, message }
  }

  /**
   * Remove file from WebR filesystem
   * @see https://docs.r-wasm.org/webr/latest/api/js/interfaces/WebR.FS.html#unlink
   */
  async removeFile(filename: string): Promise<void> {
    const filePath = `${this.UPLOAD_DIR}/${filename}`
    
    await withErrorHandling(async () => {
      await this.webR.FS.unlink(filePath)
      this.uploadedFiles.delete(filename)
    }, `Failed to remove ${filename}`)
  }

  /**
   * List files in upload directory
   * @see https://docs.r-wasm.org/webr/latest/api/js/interfaces/WebR.FS.html#readdir
   */
  async listFiles(): Promise<string[]> {
    try {
      const files = await this.webR.FS.readdir(this.UPLOAD_DIR)
      // Filter out system files
      return files.filter(file => !file.startsWith('.'))
    } catch {
      return []
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = `${this.UPLOAD_DIR}/${filename}`
      await this.webR.FS.stat(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Read file content as string
   */
  async readFile(filename: string): Promise<string> {
    return withErrorHandling(async () => {
      const filePath = `${this.UPLOAD_DIR}/${filename}`
      const bytes = await this.webR.FS.readFile(filePath)
      return new TextDecoder().decode(bytes)
    }, `Failed to read ${filename}`)
  }

  /**
   * Get list of tracked uploaded files
   */
  getUploadedFiles(): string[] {
    return Array.from(this.uploadedFiles)
  }

  /**
   * Clear tracking (doesn't remove files)
   */
  clearTracking(): void {
    this.uploadedFiles.clear()
  }

  /**
   * Get file size in bytes
   */
  async getFileSize(filename: string): Promise<number> {
    try {
      const filePath = `${this.UPLOAD_DIR}/${filename}`
      const stat = await this.webR.FS.stat(filePath)
      return stat.size
    } catch {
      return 0
    }
  }
}