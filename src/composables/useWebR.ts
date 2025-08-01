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

// Extract content from WebR output with proper type checking
const extractContentFromWebROutput = async (output: WebROutputItem): Promise<string> => {
  if (typeof output.data === 'string') {
    return output.data
  }

  // Convert WebR proxy to JavaScript object
  const proxy = output.data as WebRProxy
  const jsResult = await proxy.toJs()
  
  if (isWebRCharacterObject(jsResult)) {
    return jsResult.values.join('\n')
  }
  
  if (isWebRListObject(jsResult)) {
    // Validate assumption: we expect only 1 message in the list
    if (jsResult.values.length > 1) {
      console.error(`ASSUMPTION VIOLATION: List has ${jsResult.values.length} values, expected 1:`, jsResult)
    }
    
    const messageObject = jsResult.values[0]
    if (isWebRCharacterObject(messageObject) && messageObject.values.length > 0) {
      return messageObject.values.join('\n')
    }
    
    console.error('Unexpected list structure:', jsResult)
    return '[Unable to extract message from list]'
  }
  
  console.error('Unknown WebR object type:', jsResult)
  return `[Unknown WebR type: ${(jsResult as any)?.type || 'unknown'}]`
}

export const useWebR = () => {
  const isReady = ref(false)
  const isLoading = ref(false)
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
      isLoading.value = true
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
      isLoading.value = false
    }
  }

  const addMessage = (type: WebRMessage['type'], content: string) => {
    messages.push({ type, content })
  }

  const clearMessages = () => {
    messages.splice(0, messages.length)
  }

  const executeCode = async (code: string) => {
    if (!webR || !isReady.value) {
      addMessage('error', 'WebR is not ready. Please wait for initialization.')
      return
    }

    try {
      isLoading.value = true
      
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
        isLoading.value = true
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
      isLoading.value = false
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
    toggleLibrary,
  }
}