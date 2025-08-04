import { WebR, Shelter } from 'webr'
import { toCharacterVector } from '../utils/r-converters'
import { WebRError, withErrorHandling } from '../utils/errors'

/**
 * WebR instance manager - handles lifecycle and provides access to WebR/Shelter
 * @see https://docs.r-wasm.org/webr/latest/api/js/classes/WebR.WebR.html
 */
export class WebRInstance {
  private webR: WebR | null = null
  private shelter: Shelter | null = null
  
  /**
   * Check if WebR is initialized and ready
   */
  get isReady(): boolean {
    return this.webR !== null && this.shelter !== null
  }

  /**
   * Initialize WebR instance
   * @see https://docs.r-wasm.org/webr/latest/downloading.html#startup-options
   */
  async initialize(): Promise<{ r: string; webr: string }> {
    if (this.webR) {
      return this.getVersions()
    }

    return withErrorHandling(async () => {
      // Dynamic import to support code splitting
      const { WebR } = await import('webr')
      
      this.webR = new WebR()
      await this.webR.init()
      
      // Create shelter for isolated R evaluations
      // @see https://docs.r-wasm.org/webr/latest/evaluating.html#evaluating-r-code-in-an-isolated-environment
      this.shelter = await new this.webR.Shelter()
      
      return this.getVersions()
    }, 'WebR initialization failed')
  }

  /**
   * Destroy WebR instance and free resources
   */
  async destroy(): Promise<void> {
    if (this.shelter) {
      this.shelter.destroy()
      this.shelter = null
    }
    this.webR = null
  }

  /**
   * Get WebR instance, throws if not initialized
   */
  getWebR(): WebR {
    if (!this.webR) {
      throw new WebRError('WebR not initialized')
    }
    return this.webR
  }

  /**
   * Get Shelter instance, throws if not initialized
   */
  getShelter(): Shelter {
    if (!this.shelter) {
      throw new WebRError('Shelter not initialized')
    }
    return this.shelter
  }

  /**
   * Get R and WebR version information
   */
  private async getVersions(): Promise<{ r: string; webr: string }> {
    const webR = this.getWebR()
    
    try {
      const result = await webR.evalR('R.version.string')
      const fullVersion = await toCharacterVector(result) || 'Unknown'
      // Simplify version string: "R version 4.3.1 ..." -> "R 4.3.1"
      const rVersion = fullVersion.replace(/^R version /, 'R ')
      
      // Get WebR version from the instance
      const webrVersion = webR.version
      if (!webrVersion) {
        throw new WebRError('WebR instance does not provide version information')
      }
      return { r: rVersion, webr: webrVersion }
    } catch {
      return { r: 'Unknown', webr: '' }
    }
  }

  /**
   * Execute R code with optional fallback value
   */
  async safeEvalR(code: string, fallback = ''): Promise<string> {
    try {
      const result = await this.getWebR().evalR(code)
      return await toCharacterVector(result) || fallback
    } catch {
      return fallback
    }
  }
}