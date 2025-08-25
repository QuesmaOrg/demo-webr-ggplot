<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CodeEditor from './components/CodeEditor.vue'
import FileUpload from './components/FileUpload.vue'
import ExampleSelector from './components/ExampleSelector.vue'
import OutputDisplay from './components/OutputDisplay.vue'
import WebRStatus from './components/WebRStatus.vue'
import LibrarySelector from './components/LibrarySelector.vue'
import ConsoleOutput from './components/ConsoleOutput.vue'
import ConsoleToggle from './components/ConsoleToggle.vue'
import AppHeader from './components/AppHeader.vue'
import RunButton from './components/RunButton.vue'
import { useWebR } from './composables/useWebR'
import { examples } from './data/examples'
import type { RExample, CsvData } from './types'

// Start with the first example (getting-started)
const code = ref(examples[0].code)
const lastExecutedCode = ref('')
const hasChanges = computed(() => code.value !== lastExecutedCode.value)

// Current CSV data state
const currentCsvData = ref<CsvData | null>(null)

const {
  isReady,
  isLoading,
  isInitializing,
  isExecuting,
  loadingStatus,
  installedLibraries,
  messages,
  packageVersions,
  webrVersion,
  rVersion,
  initializeWebR,
  executeCode,
  uploadCsvData,
  clearConsoleMessages,
  toggleLibrary,
} = useWebR()

// Console component reference
const consoleRef = ref<InstanceType<typeof ConsoleOutput>>()

const runCode = async (): Promise<void> => {
  if (code.value.trim()) {
    clearConsoleMessages() // Clear console messages but keep charts visible
    await executeCode(code.value)
    lastExecutedCode.value = code.value
    
    // Auto-open console if no plots were generated
    consoleRef.value?.autoOpenConsole()
  }
}

const handleFileUpload = async (csvData: CsvData): Promise<void> => {
  currentCsvData.value = csvData
  await uploadCsvData(csvData)
}

const handleFileRemoved = (): void => {
  currentCsvData.value = null
}

const handleExampleSelect = async (example: RExample): Promise<void> => {
  code.value = example.code
  
  // Wait for WebR to be ready before loading CSV
  if (!isReady.value) {
    // WebR not ready yet - just return silently
    return
  }
  
  // Load CSV data if the example specifies a csvUrl
  if (example.csvUrl) {
    try {
      const response = await fetch(example.csvUrl)
      if (response.ok) {
        const csvContent = await response.text()
        const parseCsvInfo = (content: string): { rows: number; columns: number; columnNames: string[] } => {
          const lines = content.trim().split('\n')
          const columnNames = lines[0].split(',').map(name => name.trim().replace(/^"|"$/g, ''))
          return {
            rows: lines.length - 1,
            columns: columnNames.length,
            columnNames
          }
        }
        
        const { rows, columns, columnNames } = parseCsvInfo(csvContent)
        const csvData = {
          name: example.csvUrl.split('/').pop() || 'data.csv',
          content: csvContent,
          rows,
          columns,
          columnNames
        }
        
        // Upload the CSV data (this will load it into R as 'data')
        currentCsvData.value = csvData
        await uploadCsvData(csvData)
        
        // Execute code after CSV is loaded
        if (example.code.trim()) {
          clearConsoleMessages() // Clear console messages but keep charts visible
          await executeCode(example.code)
          lastExecutedCode.value = example.code
          
          // Auto-open console if no plots were generated
          consoleRef.value?.autoOpenConsole()
        }
      }
    } catch (error) {
      console.error('Failed to load CSV for example:', error)
    }
  } else {
    // Reset CSV data for examples without datasets
    if (currentCsvData.value) {
      handleFileRemoved()
    }
    
    // Execute code immediately for examples without CSV
    if (example.code.trim()) {
      clearConsoleMessages() // Clear console messages but keep charts visible
      await executeCode(example.code)
      lastExecutedCode.value = example.code
      
      // Auto-open console if no plots were generated
      consoleRef.value?.autoOpenConsole()
    }
  }
}

onMounted(async () => {
  // Initialize WebR first
  await initializeWebR('')
  
  // Execute the first example once WebR is ready
  if (isReady.value && examples.length > 0) {
    await handleExampleSelect(examples[0])
  }
})
</script>

<template>
  <div id="app">
    <AppHeader />

    <main class="main">
      <div class="toolbar">
        <div class="toolbar-left">
          <FileUpload 
            :uploaded-file="currentCsvData"
            @file-uploaded="handleFileUpload" 
            @file-removed="handleFileRemoved" 
          />
          <ExampleSelector @example-selected="handleExampleSelect" />
        </div>
        <div class="toolbar-right">
          <WebRStatus 
            :is-ready="isReady" 
            :is-loading="isInitializing" 
            :loading-status="loadingStatus"
            :webr-version="webrVersion"
          />
          <LibrarySelector 
            :installed-libraries="installedLibraries" 
            :is-loading="isInitializing"
            :package-versions="packageVersions"
            @toggle-library="toggleLibrary"
          />
        </div>
      </div>

      <div class="container">
        <div class="editor-section">
          <CodeEditor v-model="code" />
        </div>

        <div class="output-section">
          <OutputDisplay
            :messages="messages"
            :is-loading="isLoading"
            :is-executing="isExecuting"
          />
          <ConsoleOutput 
            ref="consoleRef"
            :messages="messages"
          />
        </div>
      </div>

      <!-- Single unified bottom bar -->
      <div class="bottom-bar">
        <div class="bottom-bar-left">
          <RunButton 
            :is-ready="isReady"
            :is-loading="isLoading"
            :has-changes="hasChanges"
            :r-version="rVersion"
            @run="runCode"
          />
        </div>
        <div class="bottom-bar-right">
          <ConsoleToggle 
            :messages="messages"
            :is-open="consoleRef?.showConsole || false"
            :is-loading="isLoading"
            @toggle="consoleRef?.toggleConsole"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
#app {
  height: 100vh;
  background-color: #f8fafc;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.toolbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.container {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  overflow: hidden;
  min-height: 0;
}

.editor-section {
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 1rem;
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.output-section {
  background: white;
  padding: 0;
  overflow: auto;
  position: relative;
  min-width: 0;
}

/* Bottom bar styling */
.bottom-bar {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
  min-height: 52px;
  flex-shrink: 0;
  gap: 1rem;
}

.bottom-bar-left {
  display: flex;
  align-items: center;
}

.bottom-bar-right {
  display: flex;
  align-items: center;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .toolbar {
    padding: 0.75rem;
  }
  
  .container {
    grid-template-columns: 1fr 1fr;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .toolbar {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
  }
  
  .container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
  
  .editor-section {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    padding: 0.5rem;
  }
  
  .output-section {
    min-height: 40vh;
  }
  
  .bottom-bar {
    padding: 0.5rem;
    min-height: 48px;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .main {
    height: 100vh;
  }
  
  .container {
    display: flex;
    flex-direction: column;
  }
  
  .editor-section,
  .output-section {
    flex: 1;
    min-height: 0;
  }
}
</style>