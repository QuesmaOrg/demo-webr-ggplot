import type { WebR, RObject } from 'webr'
import type { WebROutput, ProcessedOutput } from '../core/types'
import { toCharacterVector } from '../utils/r-converters'
import { Serializer } from './serializer'

/**
 * Processes WebR capture output into displayable format
 * @see https://docs.r-wasm.org/webr/latest/evaluating.html#capturing-r-output
 */
export class OutputProcessor {
  private serializer: Serializer

  constructor(private webR: WebR) {
    this.serializer = new Serializer(webR)
  }

  /**
   * Process a single WebR output into displayable format
   */
  async process(output: WebROutput): Promise<ProcessedOutput> {
    const content = await this.extractContent(output)
    const type = this.mapOutputType(output.type)
    
    return { type, content }
  }

  /**
   * Process multiple outputs
   */
  async processMultiple(outputs: WebROutput[]): Promise<ProcessedOutput[]> {
    return Promise.all(outputs.map(output => this.process(output)))
  }

  /**
   * Extract content from WebR output data
   * Handles both string data and R objects (including condition objects)
   */
  private async extractContent(output: WebROutput): Promise<string> {
    // If data is already a string, return it
    if (typeof output.data === 'string') {
      return output.data
    }

    // If no data, return empty
    if (!output.data) {
      return ''
    }

    // Try to convert R object to string
    try {
      // First try direct character vector conversion
      const charVector = await toCharacterVector(output.data as RObject)
      if (charVector !== null) {
        return charVector
      }

      // Handle condition objects (warnings, messages, errors) specially
      if (output.type === 'message' || output.type === 'warning' || output.type === 'error') {
        return await this.extractConditionMessage(output.data as RObject)
      }

      // Fall back to R serialization for complex objects
      return await this.serializer.serialize(output.data as RObject)
    } catch {
      return '[Unable to display output]'
    }
  }

  /**
   * Extract formatted message from R condition objects
   * Condition objects are captured when using captureConditions
   */
  private async extractConditionMessage(conditionObj: RObject): Promise<string> {
    try {
      // First, let's try to directly access the object properties
      const tempVar = `.__condition_${Date.now()}__`
      
      await this.webR.objs.globalEnv.bind(tempVar, conditionObj)
      
      // Check what type of object we have and extract accordingly
      const messageResult = await this.webR.evalR(`
        obj <- ${tempVar}
        if (is.character(obj)) {
          # If it's already a character vector, use it directly
          obj
        } else if (inherits(obj, "condition") && !is.null(obj$message)) {
          # For condition objects with message field
          obj$message
        } else if (inherits(obj, "condition")) {
          # For condition objects, use conditionMessage
          conditionMessage(obj)
        } else {
          # Last resort - convert to character
          as.character(obj)
        }
      `)
      
      // Clean up
      await this.webR.evalR(`rm(${tempVar})`)
      
      const message = await toCharacterVector(messageResult)
      return message || '[Unable to extract condition message]'
    } catch {
      // If condition extraction fails, fall back to serialization
      return await this.serializer.serialize(conditionObj)
    }
  }

  /**
   * Map WebR output types to our display types
   * 
   * WebR output types:
   * - 'stdout': Standard output stream
   * - 'stderr': Standard error stream  
   * - 'message': R message() output
   * - 'warning': R warning() output
   * - 'error': R errors
   */
  private mapOutputType(webrType?: string): ProcessedOutput['type'] {
    if (!webrType) return 'info'

    const typeMap: Record<string, ProcessedOutput['type']> = {
      'stdout': 'stdout',
      'stderr': 'stderr',
      'message': 'info',    // R messages are informational
      'warning': 'warning',
      'error': 'error',
    }

    return typeMap[webrType] || 'info'
  }

  /**
   * Process the final result of R evaluation
   * Determines if the result should be displayed based on R conventions
   * 
   * @see https://docs.r-wasm.org/webr/latest/evaluating.html#evaluating-r-code
   */
  async processResult(result: RObject | undefined): Promise<ProcessedOutput | null> {
    if (!result) return null

    try {
      const resultType = await result.type()
      
      // Don't display NULL results
      if (resultType === 'null') {
        return null
      }

      // Don't display certain object types that are typically not printed
      const skipTypes = ['closure', 'builtin', 'special']
      if (skipTypes.includes(resultType)) {
        return null
      }

      // Check if it's a ggplot or other plot object that shouldn't be serialized
      // These are handled by the captureGraphics option instead
      const isPlotObject = await this.isPlotObject(result)
      if (isPlotObject) {
        return null
      }

      // For other results, serialize and return as stdout
      const content = await this.serializer.serialize(result)
      
      // Check if content is meaningful (not just whitespace)
      if (content && content.trim()) {
        return { type: 'stdout', content }
      }

      return null
    } catch {
      // If we can't process the result, skip it
      return null
    }
  }

  /**
   * Check if an R object is a plot object (ggplot, base plot, etc.)
   */
  private async isPlotObject(result: RObject): Promise<boolean> {
    try {
      // Use R to check object class
      await this.webR.objs.globalEnv.bind('.__check_plot__', result)
      const checkResult = await this.webR.evalR(`
        inherits(.__check_plot__, c("gg", "ggplot", "recordedplot", "trellis", "grob"))
      `)
      await this.webR.evalR('rm(.__check_plot__)')
      
      const js = await checkResult.toJs()
      return js?.values?.[0] === true
    } catch {
      return false
    }
  }
}