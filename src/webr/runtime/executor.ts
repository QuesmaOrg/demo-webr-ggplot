import type { WebR, Shelter } from 'webr'
import type { ExecutionResult, WebRCaptureResult } from '../core/types'
import { OutputProcessor } from './output-processor'
import { imageToDataUrl } from '../utils/validators'
import { withErrorHandling, cleanErrorMessage } from '../utils/errors'

/**
 * Executes R code and captures output
 * @see https://docs.r-wasm.org/webr/latest/evaluating.html
 */
export class Executor {
  private outputProcessor: OutputProcessor

  constructor(
    private webR: WebR,
    private shelter: Shelter
  ) {
    this.outputProcessor = new OutputProcessor(webR)
  }

  /**
   * Execute R code and capture all output
   * @see https://docs.r-wasm.org/webr/latest/evaluating.html#capturing-r-output
   */
  async execute(code: string): Promise<ExecutionResult> {
    const startTime = performance.now()
    
    try {
      // Set R options for consistent output
      await this.webR.evalR('options(warn = 1, width = 80)')

      // Execute code with full capture
      const result = await this.shelter.captureR(code, {
        withAutoprint: true,           // Print expression results like in R console
        captureStreams: true,          // Capture stdout/stderr
        captureConditions: ['message', 'warning', 'error'], // Capture R conditions
        captureGraphics: true,         // Capture plots
        env: this.webR.objs.globalEnv, // Use global environment
      }) as WebRCaptureResult

      // Process outputs
      const outputs = await this.outputProcessor.processMultiple(result.output || [])
      
      // Process plots
      const plots = (result.images || []).map(imageToDataUrl)
      
      // Process final result (if any)
      if (result.result) {
        const resultOutput = await this.outputProcessor.processResult(result.result)
        if (resultOutput) {
          outputs.push(resultOutput)
        }
      }

      return {
        outputs,
        plots,
        duration: performance.now() - startTime,
        success: true
      }

    } catch (error) {
      // Handle execution errors
      return {
        outputs: [{
          type: 'error',
          content: cleanErrorMessage(error)
        }],
        plots: [],
        duration: performance.now() - startTime,
        success: false
      }
    }
  }

  /**
   * Execute R code without capturing output
   * Useful for setup or internal operations
   */
  async evalR(code: string): Promise<void> {
    await withErrorHandling(
      () => this.webR.evalR(code),
      'Code execution failed'
    )
  }

  /**
   * Check if a variable exists in R environment
   * @see https://docs.r-wasm.org/webr/latest/objects.html
   */
  async variableExists(name: string): Promise<boolean> {
    try {
      const result = await this.webR.evalR(`exists("${name}")`)
      const js = await result.toJs()
      return js?.values?.[0] === true
    } catch {
      return false
    }
  }

  /**
   * Clean up variables from R environment
   */
  async cleanupVariables(...names: string[]): Promise<void> {
    const cleanupCode = names
      .map(name => `if (exists("${name}")) rm(${name})`)
      .join('; ')
    
    try {
      await this.webR.evalR(cleanupCode)
    } catch {
      // Cleanup is best effort
    }
  }

  /**
   * Get information about the last R value
   * Useful for determining if result should be displayed
   */
  async shouldShowLastValue(): Promise<boolean> {
    try {
      const result = await this.webR.evalR(`
        if (exists(".Last.value")) {
          val <- .Last.value
          # Skip certain types that shouldn't be auto-printed
          if (inherits(val, c("gg", "ggplot", "recordedplot")) || 
              is.function(val) || 
              is.null(val) ||
              length(val) == 0) {
            FALSE
          } else {
            # Check if print output would be meaningful
            output <- capture.output(print(val))
            length(output) > 0 && !all(grepl("^\\\\s*$", output))
          }
        } else {
          FALSE
        }
      `)
      
      const js = await result.toJs()
      return js?.values?.[0] === true
    } catch {
      return false
    }
  }
}