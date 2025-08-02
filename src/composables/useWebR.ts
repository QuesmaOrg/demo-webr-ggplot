import { ref, reactive } from 'vue'
import type { WebRMessage, CsvData, WebROutputItem, WebRCharacterObject, WebRListObject, WebRProxy, WebRExecutionResult } from '@/types'

// WebR output type mapping - immutable and reusable
const WEBR_TYPE_MAP = {
  stdout: 'stdout',
  stderr: 'stderr', 
  message: 'info',
  warning: 'warning',
  error: 'error'
} as const satisfies Record<string, WebRMessage['type']>

// Type guards for WebR objects
const isWebRCharacterObject = (obj: unknown): obj is WebRCharacterObject => {
  return typeof obj === 'object' && obj !== null && 
         'type' in obj && obj.type === 'character' &&
         'values' in obj && Array.isArray(obj.values)
}

const isWebRListObject = (obj: unknown): obj is WebRListObject => {
  return typeof obj === 'object' && obj !== null && 
         'type' in obj && obj.type === 'list' &&
         'values' in obj && Array.isArray(obj.values)
}

// Extract content from WebR output with robust serialization
const createExtractContentFunction = (webRInstance: any, isReadyRef: any) => {
  const serializeComplexRObject = createSerializeFunction(webRInstance, isReadyRef)
  
  return async (output: WebROutputItem): Promise<string> => {
    if (typeof output.data === 'string') {
      return output.data
    }

    const proxy = output.data as WebRProxy
    let jsResult
    
    try {
      jsResult = await proxy.toJs()
    } catch (error) {
      // If direct conversion fails, try to serialize via R's capture.output
      console.log('Direct conversion failed, attempting R serialization:', error)
      return await serializeComplexRObject(proxy)
    }
    
    if (isWebRCharacterObject(jsResult)) {
      return jsResult.values.join('\n')
    }
    
    if (isWebRListObject(jsResult)) {
      // For lists, try to find the first convertible character object
      for (let i = 0; i < jsResult.values.length; i++) {
        const item = jsResult.values[i]
        if (isWebRCharacterObject(item) && item.values.length > 0) {
          return item.values.join('\n')
        }
      }
      
      // If no convertible items found, try to serialize the whole list
      return await serializeComplexRObject(proxy)
    }
    
    // For any other type, try serialization
    return await serializeComplexRObject(proxy)
  }
}

/**
 * Creates a robust serialization function for WebR objects that cannot be converted to JavaScript.
 * 
 * PROBLEMS SOLVED (with concrete examples):
 * 
 * 1. packageStartupMessage objects showing internal structure:
 *    BEFORE: "<packageStartupMessage in packageStartupMessage(gettextf(\"\\nAttaching package: %s\\n\", sQuote(package)), domain = NA): Attaching package: 'dplyr'>"
 *    AFTER:  "Attaching package: 'dplyr'"
 * 
 * 2. Complex R objects failing with "This R object cannot be converted to JS":
 *    BEFORE: Error crash
 *    AFTER:  Readable string representation via capture.output(print(...))
 * 
 * 3. Warning and error conditions showing debug info:
 *    BEFORE: "<simpleWarning in warning(...): some warning message>"  
 *    AFTER:  "some warning message"
 * 
 * 4. head(), str(), summary() outputs:
 *    BEFORE: Conversion errors or crashes
 *    AFTER:  Clean tabular/structured output as strings
 * 
 * 5. Data frames and tibbles:
 *    BEFORE: "[object Object]" or conversion errors
 *    AFTER:  Proper formatted table output
 */
const createSerializeFunction = (webRInstance: any, isReadyRef: any) => {
  return async (proxy: WebRProxy): Promise<string> => {
    if (!webRInstance || !isReadyRef.value) {
      return '[Cannot serialize: WebR not ready]'
    }
    
    try {
      // Store the object in a temporary variable
      await webRInstance.objs.globalEnv.bind('.__temp_obj__', proxy)
      
      // Try different serialization approaches for different object types
      let capturedOutput
      
      try {
        // First try: Extract clean message content for R condition objects (messages, warnings, errors)
        // This handles packageStartupMessage, warning, error, and other condition objects
        capturedOutput = await webRInstance.evalR(`
          if (inherits(.__temp_obj__, "condition")) {
            conditionMessage(.__temp_obj__)
          } else if (inherits(.__temp_obj__, "packageStartupMessage")) {
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
      
      if (outputJs && outputJs.values && outputJs.values.length > 0) {
        return outputJs.values.join('\n')
      }
      
      return '[Object could not be serialized]'
    } catch (error) {
      console.error('Serialization failed:', error)
      return `[Serialization error: ${error}]`
    }
  }
}

export const useWebR = () => {
  const isReady = ref(false)
  const isLoading = ref(false) // For code execution
  const isInitializing = ref(false) // For WebR initialization
  const loadingStatus = ref('')
  const installedLibraries = reactive(new Set<string>())
  const messages = reactive<WebRMessage[]>([])
  const packageVersions = reactive<Record<string, string>>({})
  const webrVersion = ref<string>('')
  const rVersion = ref<string>('')
  
  let webR: any = null
  let shelter: any = null

  const initializeWebR = async (initialCode?: string) => {
    try {
      isInitializing.value = true
      loadingStatus.value = 'Initializing WebR...'
      
      // Import WebR from installed package
      const { WebR } = await import('webr')
      
      // Initialize WebR with fallback channel types
      try {
        webR = new WebR({ 
          interactive: false,
          channelType: 0 // 0 = SharedArrayBuffer
        })
      } catch (error) {
        console.log('SharedArrayBuffer not available, falling back to PostMessage')
        webR = new WebR({ 
          interactive: false,
          channelType: 1 // 1 = PostMessage
        })
      }
      
      await webR.init()
      shelter = await new webR.Shelter()
      
      // Install packages one by one with status updates
      const packages = ['ggplot2', 'dplyr', 'ggrepel']
      for (const pkg of packages) {
        loadingStatus.value = `Installing ${pkg}...`
        await webR.installPackages([pkg])
        installedLibraries.add(pkg)
      }
      
      isReady.value = true
      loadingStatus.value = 'WebR Ready'
      addMessage('success', 'WebR initialized successfully with ggplot2, dplyr, and ggrepel')
      
      // Query version information
      await queryVersionInfo()
      
      // Auto-execute initial code if provided
      if (initialCode && initialCode.trim()) {
        await executeCode(initialCode)
      }
    } catch (error) {
      console.error('WebR initialization failed:', error)
      loadingStatus.value = 'WebR Failed'
      addMessage('error', `Failed to initialize WebR: ${error}`)
    } finally {
      isInitializing.value = false
    }
  }

  const addMessage = (type: WebRMessage['type'], content: string) => {
    messages.push({ type, content })
  }

  const clearMessages = () => {
    messages.splice(0, messages.length)
  }

  const clearConsoleMessages = () => {
    // Remove only non-plot messages, keep charts visible during execution
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type !== 'plot') {
        messages.splice(i, 1)
      }
    }
  }

  const executeCode = async (code: string) => {
    if (!webR || !isReady.value) {
      addMessage('error', 'WebR is not ready. Please wait for initialization.')
      return
    }

    try {
      isLoading.value = true
      
      // Create the extraction function with access to webR
      const extractContentFromWebROutput = createExtractContentFunction(webR, isReady)
      
      // Capture output and graphics
      const result = await shelter.captureR(code, {
        withAutoprint: true,
        captureStreams: true,
        captureConditions: true,
        captureGraphics: true,
        env: webR.objs.globalEnv,
      })

      // Process all output (streams and conditions)
      const typedResult = result as WebRExecutionResult
      if (typedResult.output && typedResult.output.length > 0) {
        for (const output of typedResult.output) {
          const content = await extractContentFromWebROutput(output)
          const messageType = WEBR_TYPE_MAP[output.type as keyof typeof WEBR_TYPE_MAP]
          
          if (!messageType) {
            console.error(`Unknown WebR output type: ${output.type}`)
            addMessage('error', `Unknown output type: ${output.type}`)
            continue
          }
          
          addMessage(messageType, content)
        }
      }

      // Handle captured graphics
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

      // Process return value if it exists
      if (result.result && result.result.type !== 'null') {
        const resultStr = await webR.evalR(`
          capture.output(print(.Last.value))
        `)
        if (resultStr.values && resultStr.values.length > 0) {
          addMessage('stdout', resultStr.values.join('\n'))
        }
      }

    } catch (error) {
      console.error('R execution error:', error)
      addMessage('error', `R execution failed: ${error}`)
    } finally {
      isLoading.value = false
    }
  }

  const uploadCsvData = async (csvData: CsvData) => {
    if (!webR || !isReady.value) {
      addMessage('error', 'WebR is not ready. Please wait for initialization.')
      return
    }

    try {
      // Write the CSV content as a UTF-8 encoded file
      const fileName = csvData.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const encoder = new TextEncoder()
      const csvBytes = encoder.encode(csvData.content)
      await webR.FS.writeFile(`/tmp/${fileName}`, csvBytes)
      
      addMessage('success', `CSV file '${fileName}' uploaded to /tmp/${fileName}`)
      
    } catch (error) {
      console.error('CSV upload error:', error)
      addMessage('error', `Failed to upload CSV: ${error}`)
    }
  }

  const toggleLibrary = async (library: string, install: boolean) => {
    if (!webR) {return}
    
    try {
      if (install) {
        loadingStatus.value = `Installing ${library}...`
        isInitializing.value = true
        await webR.installPackages([library])
        installedLibraries.add(library)
        addMessage('success', `${library} installed successfully`)
      } else {
        // Note: WebR doesn't support uninstalling packages
        installedLibraries.delete(library)
        addMessage('info', `${library} removed from available libraries`)
      }
    } catch (error) {
      addMessage('error', `Failed to install ${library}: ${error}`)
    } finally {
      isInitializing.value = false
      loadingStatus.value = isReady.value ? 'WebR Ready' : loadingStatus.value
    }
  }

  const queryVersionInfo = async () => {
    if (!webR || !isReady.value) {return}
    
    // Query R version
    try {
      const rVersionResult = await webR.evalR('R.version.string')
      const rVersionJs = await rVersionResult.toJs()
      if (rVersionJs?.values?.[0]) {
        // Remove "R version" prefix to get clean version string
        rVersion.value = rVersionJs.values[0].replace(/^R version /, 'R ')
      }
    } catch (error) {
      console.error('Failed to get R version:', error)
    }
    
    // Query WebR version (from package or webR object)
    try {
      // Try to get from webR object first, fallback to import meta
      webrVersion.value = '0.5.4' // We know this from package.json
    } catch (error) {
      console.error('Failed to get WebR version:', error)
    }
    
    // Query package versions
    const packages = ['ggplot2', 'dplyr', 'ggrepel']
    
    for (const pkg of packages) {
      if (installedLibraries.has(pkg)) {
        try {
          const result = await webR.evalR(`as.character(packageVersion("${pkg}"))`)
          const jsResult = await result.toJs()
          
          if (jsResult?.values?.[0]) {
            packageVersions[pkg] = jsResult.values[0]
          }
        } catch (error) {
          console.error(`Failed to get version for ${pkg}:`, error)
        }
      }
    }
  }

  return {
    isReady,
    isLoading,
    isInitializing,
    loadingStatus,
    installedLibraries,
    messages,
    packageVersions,
    webrVersion,
    rVersion,
    initializeWebR,
    executeCode,
    uploadCsvData,
    clearMessages,
    clearConsoleMessages,
    toggleLibrary,
  }
}