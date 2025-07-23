import { ref, reactive } from 'vue'
import type { WebRMessage, CsvData } from '@/types'

export const useWebR = () => {
  const isReady = ref(false)
  const isLoading = ref(false)
  const messages = reactive<WebRMessage[]>([])
  
  let webR: any = null
  let shelter: any = null

  const initializeWebR = async () => {
    try {
      isLoading.value = true
      
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
      
      // Install required packages
      await webR.installPackages(['ggplot2', 'dplyr', 'ggrepel'])
      
      isReady.value = true
      addMessage('success', 'WebR initialized successfully with ggplot2, dplyr, and ggrepel')
    } catch (error) {
      console.error('WebR initialization failed:', error)
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
        captureConditions: false,
        captureGraphics: true,
        env: webR.objs.globalEnv,
      })

      // Process stdout
      if (result.output && result.output.length > 0) {
        for (const output of result.output) {
          if (output.type === 'stdout' && output.data) {
            addMessage('stdout', output.data)
          } else if (output.type === 'stderr' && output.data) {
            addMessage('stderr', output.data)
          }
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
      isLoading.value = true
      
      // Create a temporary file in WebR's filesystem
      const fileName = csvData.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      await webR.FS.writeFile(`/tmp/${fileName}`, csvData.content)
      
      // Read the CSV into R
      const readCode = `
        data <- read.csv("/tmp/${fileName}", stringsAsFactors = FALSE)
        cat("CSV file '${csvData.name}' loaded successfully\\n")
        cat("Dimensions:", nrow(data), "rows,", ncol(data), "columns\\n")
        cat("Column names:", paste(names(data), collapse = ", "), "\\n")
        head(data)
      `
      
      await executeCode(readCode)
      
    } catch (error) {
      console.error('CSV upload error:', error)
      addMessage('error', `Failed to upload CSV: ${error}`)
    } finally {
      isLoading.value = false
    }
  }

  return {
    isReady,
    isLoading,
    messages,
    initializeWebR,
    executeCode,
    uploadCsvData,
    clearMessages,
  }
}