import type { WebR, RObject } from 'webr'
import { toCharacterVector } from '../utils/r-converters'
import { withErrorHandling } from '../utils/errors'

/**
 * Handles R object serialization to string representation
 * @see https://docs.r-wasm.org/webr/latest/convert-js.html
 * @see https://docs.r-wasm.org/webr/latest/objects.html#inspecting-r-objects
 */
export class Serializer {
  constructor(private webR: WebR) {}

  /**
   * Serialize R objects to their string representation using R's print function
   * 
   * Typical outputs:
   * - data.frame: "  col1 col2\n1 val1 val2\n2 val3 val4"
   * - numeric vector: "[1] 1 2 3 4 5"
   * - character vector: '[1] "hello" "world"'
   * - list: "$item1\n[1] 1 2 3\n\n$item2\n[1] 'text'"
   * - matrix: "     [,1] [,2]\n[1,]    1    3\n[2,]    2    4"
   * - NULL: "NULL"
   * - function: "function (x) \n{\n    x + 1\n}"
   * - factor: "[1] a b c\nLevels: a b c"
   */
  async serialize(rObject: RObject): Promise<string> {
    return withErrorHandling(async () => {
      const tempVar = '.__serializer_temp__'
      
      try {
        // Bind object to temporary variable in global environment
        await this.webR.objs.globalEnv.bind(tempVar, rObject)
        
        // Use capture.output to get the printed representation
        const result = await this.webR.evalR(`capture.output(print(${tempVar}))`)
        const output = await toCharacterVector(result)
        
        return output || '[Object could not be serialized]'
      } finally {
        // Always clean up temporary variable
        await this.cleanupTempVar(tempVar)
      }
    }, 'Serialization failed')
  }

  /**
   * Serialize R object with custom print options
   * @param rObject - The R object to serialize
   * @param options - Print options (e.g., { digits: 2, max: 100 })
   */
  async serializeWithOptions(
    rObject: RObject, 
    options: Record<string, unknown> = {}
  ): Promise<string> {
    return withErrorHandling(async () => {
      const tempVar = '.__serializer_temp__'
      const optionsStr = Object.entries(options)
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join(', ')
      
      try {
        await this.webR.objs.globalEnv.bind(tempVar, rObject)
        
        const printCommand = optionsStr 
          ? `print(${tempVar}, ${optionsStr})`
          : `print(${tempVar})`
          
        const result = await this.webR.evalR(`capture.output(${printCommand})`)
        const output = await toCharacterVector(result)
        
        return output || '[Object could not be serialized]'
      } finally {
        await this.cleanupTempVar(tempVar)
      }
    }, 'Serialization with options failed')
  }

  /**
   * Get summary of an R object
   * Useful for data frames, models, etc.
   */
  async summarize(rObject: RObject): Promise<string> {
    return withErrorHandling(async () => {
      const tempVar = '.__serializer_temp__'
      
      try {
        await this.webR.objs.globalEnv.bind(tempVar, rObject)
        const result = await this.webR.evalR(`capture.output(summary(${tempVar}))`)
        const output = await toCharacterVector(result)
        
        return output || '[Could not generate summary]'
      } finally {
        await this.cleanupTempVar(tempVar)
      }
    }, 'Summary generation failed')
  }

  /**
   * Get structure information of an R object
   * Similar to R's str() function
   */
  async structure(rObject: RObject): Promise<string> {
    return withErrorHandling(async () => {
      const tempVar = '.__serializer_temp__'
      
      try {
        await this.webR.objs.globalEnv.bind(tempVar, rObject)
        const result = await this.webR.evalR(`capture.output(str(${tempVar}))`)
        const output = await toCharacterVector(result)
        
        return output || '[Could not get structure]'
      } finally {
        await this.cleanupTempVar(tempVar)
      }
    }, 'Structure inspection failed')
  }

  /**
   * Clean up temporary variable from R environment
   */
  private async cleanupTempVar(varName: string): Promise<void> {
    try {
      await this.webR.evalR(`if (exists("${varName}")) rm(${varName})`)
    } catch {
      // Cleanup is best effort, don't throw if it fails
    }
  }
}