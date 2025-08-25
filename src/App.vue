<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

// Mobile state
const activePanel = ref<'code' | 'chart'>('code')
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

// Update width on resize
const updateWidth = (): void => {
  windowWidth.value = window.innerWidth
}

// Lifecycle hooks
onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
})

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
  // Add resize listener
  window.addEventListener('resize', updateWidth)
  
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
      <!-- Mobile toolbar -->
      <div
        v-if="isMobile"
        class="mobile-toolbar"
      >
        <FileUpload 
          :uploaded-file="currentCsvData"
          @file-uploaded="handleFileUpload" 
          @file-removed="handleFileRemoved" 
        />
        <ExampleSelector @example-selected="handleExampleSelect" />
        <LibrarySelector 
          :installed-libraries="installedLibraries" 
          :is-loading="isInitializing"
          :package-versions="packageVersions"
          @toggle-library="toggleLibrary"
        />
      </div>

      <!-- Desktop toolbar -->
      <div
        v-else
        class="toolbar"
      >
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

      <!-- Mobile split view with glimpse -->
      <div
        v-if="isMobile"
        class="mobile-container"
      >
        <div 
          class="panel-wrapper code-panel"
          :class="{ active: activePanel === 'code', collapsed: activePanel === 'chart' }"
          @click="activePanel === 'chart' ? activePanel = 'code' : null"
        >
          <div
            v-show="activePanel === 'chart'"
            class="panel-label"
          >
            CODE
          </div>
          <div class="panel-content-wrapper">
            <CodeEditor v-model="code" />
          </div>
        </div>

        <div 
          class="panel-wrapper chart-panel"
          :class="{ active: activePanel === 'chart', collapsed: activePanel === 'code' }"
          @click="activePanel === 'code' ? activePanel = 'chart' : null"
        >
          <div
            v-show="activePanel === 'code'"
            class="panel-label"
          >
            CHART
          </div>
          <div class="panel-content-wrapper">
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
      </div>

      <!-- Desktop view -->
      <div
        v-else
        class="container"
      >
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

/* Mobile toolbar */
.mobile-toolbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  height: 32px;
}


/* Mobile split view */
.mobile-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.panel-wrapper {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.panel-wrapper.active {
  flex: 1;
}

.panel-wrapper.collapsed {
  width: 80px;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.panel-wrapper.collapsed:first-child {
  border-right: 1px solid #e5e7eb;
}

.panel-wrapper.collapsed:last-child {
  border-left: 1px solid #e5e7eb;
}

.panel-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
  font-size: 0.75rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.panel-content-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: calc(100vw - 80px);
  overflow: hidden;
}

.panel-wrapper.active .panel-content-wrapper {
  opacity: 1;
  overflow: auto;
}

.panel-wrapper.collapsed .panel-content-wrapper {
  opacity: 0.3;
  pointer-events: none;
}

/* Desktop toolbar */
.toolbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 1rem;
}

.toolbar-left {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
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
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.05);
  min-height: 48px;
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
  .mobile-toolbar {
    display: flex;
  }
  
  .mobile-container {
    display: flex;
    flex: 1;
    min-height: 0;
    height: 100%;
  }
  
  .toolbar {
    display: none;
  }
  
  .container {
    display: none;
  }
  
  .bottom-bar {
    padding: 0.25rem 0.5rem;
    min-height: 36px;
    box-shadow: 0 -1px 1px rgba(0, 0, 0, 0.05);
  }
  
  .panel-wrapper {
    min-height: 0;
    height: 100%;
  }
  
  .panel-wrapper.active {
    width: calc(100% - 80px);
    flex: none;
  }
  
  .code-panel .panel-content-wrapper,
  .chart-panel .panel-content-wrapper {
    height: 100%;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .main {
    height: 100vh;
  }
  
  .panel-wrapper.collapsed {
    width: 50px; /* Even smaller on very narrow screens */
  }
  
  .panel-wrapper.active {
    width: calc(100% - 50px);
  }
  
  .panel-content-wrapper {
    width: calc(100vw - 50px); /* Adjust for smaller collapsed width */
  }
  
  .panel-label {
    font-size: 0.625rem;
    padding: 0.25rem 0.375rem;
  }
}
</style>