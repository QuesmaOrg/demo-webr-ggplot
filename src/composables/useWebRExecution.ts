/**
 * WebR Code Execution with Enhanced Error Handling
 * 
 * This module provides comprehensive R code execution in WebR with enhanced error reporting
 * that matches RStudio's behavior. It solves the critical issue where WebR's default error
 * handling loses warning messages that contain essential debugging information.
 * 
 * KEY FEATURES:
 * - Captures complete error messages including associated warnings
 * - Maintains RStudio-compatible error format: "Error + In addition: Warning message:"
 * - Provides clean abstractions for error handling, message extraction, and cleanup
 * - Handles WebR-specific quirks like internal message prefixes
 * 
 * EXAMPLE IMPROVEMENT:
 * Before: "Error in file(file, "rt"): cannot open the connection"
 * After:  "cannot open the connection\n\nIn addition: Warning message:\n cannot open file '/tmp/missing.csv': No such file or directory"
 * 
 * The enhanced error messages provide file paths and context that are crucial for user debugging.
 */

import type { Ref } from 'vue'
import type { WebR, Shelter } from 'webr'
import type { WebRMessage } from '@/types'
import { createExtractContentFunction } from './useWebRSerializaton'

/**
 * Creates a WebR-compatible code wrapper that captures complete error messages with warnings.
 * 
 * PROBLEM: WebR's default error handling only shows the main error message, losing crucial
 * warning details that often contain essential debugging information (like file paths).
 * 
 * SOLUTION: This function wraps user code with R's condition handling system to:
 * 1. Intercept warnings as they occur (but only store them, don't suppress normal display)
 * 2. Store them temporarily for error message enhancement
 * 3. Combine them with errors in RStudio-compatible format when errors occur
 * 
 * IMPORTANT: This only enhances ERROR messages. Normal warnings are displayed normally.
 * 
 * @param userCode - The R code to execute
 * @returns R code wrapped with enhanced error handling
 */
export const createErrorCapturingWrapper = (userCode: string): string => {
  return `
    # Initialize temporary storage for warnings collected during execution
    assign(".webr_collected_warnings", character(0), envir = .GlobalEnv)
    
    tryCatch(
      withCallingHandlers({
        ${userCode}
      }, warning = function(w) {
        # Intercept warnings as they occur and store them for potential error enhancement
        # BUT let them continue to be displayed normally (don't suppress)
        current_warnings <- get(".webr_collected_warnings", envir = .GlobalEnv)
        new_warning <- conditionMessage(w)
        assign(".webr_collected_warnings", c(current_warnings, new_warning), envir = .GlobalEnv)
        # DON'T suppress - let warnings display normally for successful executions
        # invokeRestart("muffleWarning")  # REMOVED - this was causing duplication issues
      }),
      error = function(e) {
        # Combine error with any collected warnings in RStudio format
        error_msg <- conditionMessage(e)
        collected_warnings <- get(".webr_collected_warnings", envir = .GlobalEnv)
        
        if (length(collected_warnings) > 0) {
          warning_text <- paste(collected_warnings, collapse = "\\n")
          error_msg <- paste(error_msg, "\\n\\nIn addition: Warning message:\\n", warning_text)
        }
        
        # Store the complete error message for retrieval
        assign(".webr_complete_error", error_msg, envir = .GlobalEnv)
        
        # Re-throw the original error to maintain normal error flow
        stop(e)
      }
    )
  `
}

/**
 * Extracts enhanced error message from WebR, falling back to basic error if needed.
 * 
 * @param webR - WebR instance
 * @param fallbackMessage - Basic error message to use if enhanced retrieval fails
 * @returns Promise<string> - Enhanced error message with warnings, or fallback
 */
export const extractEnhancedErrorMessage = async (
  webR: WebR, 
  fallbackMessage: string
): Promise<string> => {
  try {
    const completeErrorCapture = await webR.evalR(`
      if (exists(".webr_complete_error", envir = .GlobalEnv)) {
        get(".webr_complete_error", envir = .GlobalEnv)
      } else {
        ""
      }
    `)
    
    const completeErrorJs = await completeErrorCapture.toJs()
    // Type guard to check if this is a character object with values
    if (
      completeErrorJs && 
      typeof completeErrorJs === 'object' && 
      'values' in completeErrorJs && 
      Array.isArray(completeErrorJs.values) && 
      completeErrorJs.values.length > 0
    ) {
      const completeMessage = completeErrorJs.values.join('\n')
      // Use the enhanced message if it's more informative
      if (completeMessage.trim() && completeMessage.length > fallbackMessage.length) {
        return completeMessage
      }
    }
  } catch {
    // If enhanced error retrieval fails, use fallback
  }
  
  return fallbackMessage
}

/**
 * Cleans up temporary variables created during error handling.
 * This is important to prevent memory leaks and variable pollution.
 * 
 * @param webR - WebR instance
 */
export const cleanupErrorHandlingVariables = async (webR: WebR): Promise<void> => {
  try {
    await webR.evalR(`
      if (exists(".webr_complete_error", envir = .GlobalEnv)) {
        rm(.webr_complete_error, envir = .GlobalEnv)
      }
      if (exists(".webr_collected_warnings", envir = .GlobalEnv)) {
        rm(.webr_collected_warnings, envir = .GlobalEnv)
      }
    `)
  } catch {
    // Cleanup is optional - don't let it break error reporting
  }
}

// WebR output type mapping - immutable and reusable
const WEBR_TYPE_MAP = {
  stdout: 'stdout',
  stderr: 'stderr', 
  message: 'info',
  warning: 'warning',
  error: 'error'
} as const satisfies Record<string, WebRMessage['type']>

export const createExecuteCodeFunction = (
  webR: WebR,
  shelter: Shelter,
  isReady: Ref<boolean>,
  addMessage: (type: WebRMessage['type'], content: string) => void
) => {
  return async (code: string): Promise<void> => {
    if (!webR || !isReady.value) {
      addMessage('error', 'WebR is not ready. Please wait for initialization.')
      return
    }

    try {
      // Create the extraction function with access to webR
      const extractContentFromWebROutput = createExtractContentFunction(webR, isReady)
      
      // Set up more verbose error reporting in R before execution
      await webR.evalR('options(warn = 1, show.error.messages = TRUE, error.verbose = TRUE)')
      
      // Wrap user code with enhanced error handling to capture warnings with errors
      const wrappedCode = createErrorCapturingWrapper(code)
      
      // Capture output and graphics with enhanced options
      const result = await shelter.captureR(wrappedCode, {
        withAutoprint: true,
        captureStreams: true,
        captureConditions: ['condition'], // Capture all condition types
        captureGraphics: true,
        env: webR.objs.globalEnv,
      })
      
      // Always process any captured output first, even if there will be an error
      if (result.output && result.output.length > 0) {
        for (const output of result.output) {
          const content = await extractContentFromWebROutput(output)
          // Type-safe lookup in WEBR_TYPE_MAP
          const messageType = (output.type in WEBR_TYPE_MAP) 
            ? WEBR_TYPE_MAP[output.type as keyof typeof WEBR_TYPE_MAP]
            : 'info'
          
          addMessage(messageType, content)
        }
      }

      // Handle captured graphics (result.images is ImageBitmap[] from WebR's captureR)
      if (result.images && result.images.length > 0) {
        for (const img of result.images) {
          // Create canvas and convert to data URL
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const dataUrl = canvas.toDataURL()
            addMessage('plot', dataUrl)
          }
        }
      }

      // Process return value if it exists (result.result is RObject from WebR's captureR)
      if (result.result) {
        try {
          const resultType = await result.result.type()
          if (resultType !== 'null') {
            // Check what type of result we have and whether it should be displayed
            const resultCheck = await webR.evalR(`
              if (exists(".Last.value")) {
                val <- .Last.value
                
                # Skip output for plots and graphics objects
                if (inherits(val, c("gg", "ggplot", "recordedplot"))) {
                  "plot"
                } else if (is.list(val) && !is.null(val$bitmapType)) {
                  "plot"
                } else if (is.function(val)) {
                  "function"
                } else if (length(val) == 0) {
                  "empty"
                } else if (is.null(val)) {
                  "null"
                } else if (identical(val, invisible(NULL))) {
                  "invisible"
                } else {
                  # Check if it's a meaningful result worth displaying
                  output <- capture.output(print(val))
                  if (length(output) > 0 && !all(grepl("^\\s*$", output))) {
                    "display"
                  } else {
                    "empty"
                  }
                }
              } else {
                "null"
              }
            `)
            const resultJs = await resultCheck.toJs()
            // Type guard to safely check the result
            const shouldDisplay = (
              resultJs && 
              typeof resultJs === 'object' && 
              'values' in resultJs && 
              Array.isArray(resultJs.values) && 
              resultJs.values.length > 0 &&
              resultJs.values[0] === "display"
            )
            
            // Only show text output for meaningful results
            if (shouldDisplay) {
              const resultStr = await webR.evalR(`
                capture.output(print(.Last.value))
              `)
              const displayJs = await resultStr.toJs()
              // Type guard for display result
              if (
                displayJs && 
                typeof displayJs === 'object' && 
                'values' in displayJs && 
                Array.isArray(displayJs.values) && 
                displayJs.values.length > 0
              ) {
                addMessage('stdout', displayJs.values.join('\\n'))
              }
            }
          }
        } catch {
          // If we can't process the result, skip it silently
        }
      }

    } catch (error) {
      // Extract the most informative error message available
      let errorMessage = String(error)
      
      // Remove WebR internal prefixes like "M: " if present
      if (errorMessage.startsWith('M: ')) {
        errorMessage = errorMessage.substring(3)
      }
      
      // Try to get enhanced error message with warnings
      const enhancedMessage = await extractEnhancedErrorMessage(webR, errorMessage)
      
      // Clean up temporary variables created during error handling
      await cleanupErrorHandlingVariables(webR)
      
      addMessage('error', enhancedMessage)
    }
  }
}