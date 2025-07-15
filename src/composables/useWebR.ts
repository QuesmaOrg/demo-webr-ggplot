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
      
      // Import WebR
      const { WebR } = await import('webr')
      
      // Initialize WebR
      webR = new WebR({
        serviceWorkerUrl: '/node_modules/webr/dist/webr-worker.js',
        packageCacheDirectory: '/cache/',
        repoUrl: 'https://repo.r-wasm.org',
      })
      
      await webR.init()
      shelter = await new webR.Shelter()
      
      // Install required packages
      await webR.installPackages(['ggplot2', 'dplyr'])
      
      isReady.value = true
      addMessage('success', 'WebR initialized successfully with ggplot2 and dplyr')
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
      
      // Capture output
      const result = await shelter.captureR(code, {
        withAutoprint: true,
        captureStreams: true,
        captureConditions: false,
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

      // Check for plots
      const plots = await webR.evalR(`
        if (length(dev.list()) > 0) {
          plot_data <- .Last.value
          if (exists('.Last.value') && inherits(.Last.value, 'ggplot')) {
            tmp_file <- tempfile(fileext = '.svg')
            ggsave(tmp_file, plot = .Last.value, width = 8, height = 6)
            readLines(tmp_file, warn = FALSE)
          } else {
            NULL
          }
        } else {
          NULL
        }
      `)

      if (plots && plots.values && plots.values.length > 0) {
        const svgContent = plots.values.join('\n')
        const dataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`
        addMessage('plot', dataUrl)
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