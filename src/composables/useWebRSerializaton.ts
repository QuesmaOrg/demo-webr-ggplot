import type { Ref } from 'vue'
import type { WebR } from 'webr'
import type { WebROutputItem, WebRCharacterObject, WebRListObject, WebRProxy } from '@/types'

// Type guards for WebR objects
export const isWebRCharacterObject = (obj: unknown): obj is WebRCharacterObject => {
  return typeof obj === 'object' && obj !== null && 
         'type' in obj && obj.type === 'character' &&
         'values' in obj && Array.isArray(obj.values)
}

export const isWebRListObject = (obj: unknown): obj is WebRListObject => {
  return typeof obj === 'object' && obj !== null && 
         'type' in obj && obj.type === 'list' &&
         'values' in obj && Array.isArray(obj.values)
}

/**
 * Creates a robust serialization function for WebR objects that cannot be converted to JavaScript.
 * 
 * PROBLEMS SOLVED (with concrete examples):
 * 
 * 1. packageStartupMessage objects showing internal structure:
 *    BEFORE: \"<packageStartupMessage in packageStartupMessage(gettextf(\\\"\\\\nAttaching package: %s\\\\n\\\", sQuote(package)), domain = NA): Attaching package: 'dplyr'>\"
 *    AFTER:  \"Attaching package: 'dplyr'\"
 * 
 * 2. Complex R objects failing with \"This R object cannot be converted to JS\":
 *    BEFORE: Error crash
 *    AFTER:  Readable string representation via capture.output(print(...))
 * 
 * 3. Warning and error conditions showing debug info:
 *    BEFORE: \"<simpleWarning in warning(...): some warning message>\"  
 *    AFTER:  \"some warning message\"
 * 
 * 4. head(), str(), summary() outputs:
 *    BEFORE: Conversion errors or crashes
 *    AFTER:  Clean tabular/structured output as strings
 * 
 * 5. Data frames and tibbles:
 *    BEFORE: \"[object Object]\" or conversion errors
 *    AFTER:  Proper formatted table output
 */
export const createSerializeFunction = (webRInstance: WebR, isReadyRef: Ref<boolean>) => {
  return async (proxy: string | WebRProxy): Promise<string> => {
    if (!webRInstance || !isReadyRef.value) {
      return '[Cannot serialize: WebR not ready]'
    }
    
    try {
      // Store the object in a temporary variable
      if (typeof proxy === 'string') {
        return proxy
      }
      await webRInstance.objs.globalEnv.bind('.__temp_obj__', proxy)
      
      // Try different serialization approaches for different object types
      let capturedOutput
      
      try {
        // First try: Extract clean message content for R condition objects (messages, warnings, errors)
        // This handles packageStartupMessage, warning, error, and other condition objects
        capturedOutput = await webRInstance.evalR(`
          if (inherits(.__temp_obj__, 'condition')) {
            conditionMessage(.__temp_obj__)
          } else if (inherits(.__temp_obj__, 'packageStartupMessage')) {
            conditionMessage(.__temp_obj__)
          } else {
            capture.output(print(.__temp_obj__))
          }
        `)
      } catch {
        // Fallback: Use basic print capture for complex objects like data frames, lists, etc.
        capturedOutput = await webRInstance.evalR('capture.output(print(.__temp_obj__))')
      }
      
      const outputJs = await capturedOutput.toJs()
      
      // Clean up the temporary variable
      await webRInstance.evalR('rm(.__temp_obj__, envir = .GlobalEnv)')
      
      // Type guard to safely access values
      if (
        outputJs && 
        typeof outputJs === 'object' && 
        'values' in outputJs && 
        Array.isArray(outputJs.values) && 
        outputJs.values.length > 0
      ) {
        return outputJs.values.join('\\n')
      }
      
      return '[Object could not be serialized]'
    } catch (error) {
      return `[Serialization error: ${error}]`
    }
  }
}

// Extract content from WebR output with robust serialization
export const createExtractContentFunction = (webRInstance: WebR, isReadyRef: Ref<boolean>): ((output: WebROutputItem) => Promise<string>) => {
  const serializeComplexRObject = createSerializeFunction(webRInstance, isReadyRef)
  
  return async (output: WebROutputItem): Promise<string> => {
    if (typeof output.data === 'string') {
      return output.data
    }

    const proxy = output.data
    let jsResult
    
    try {
      jsResult = await proxy.toJs()
    } catch (error) {
      // Expected for complex R objects (dplyr groups, etc.) - use R serialization
      return await serializeComplexRObject(proxy)
    }
    
    if (isWebRCharacterObject(jsResult)) {
      return jsResult.values.join('\\n')
    }
    
    if (isWebRListObject(jsResult)) {
      // For lists, try to find the first convertible character object
      for (let i = 0; i < jsResult.values.length; i++) {
        const item = jsResult.values[i]
        if (isWebRCharacterObject(item) && item.values.length > 0) {
          return item.values.join('\\n')
        }
      }
      
      // If no convertible items found, try to serialize the whole list
      return await serializeComplexRObject(proxy)
    }
    
    // For any other type, try serialization
    return await serializeComplexRObject(proxy)
  }
}