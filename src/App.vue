<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CodeEditor from './components/CodeEditor.vue'
import FileUpload from './components/FileUpload.vue'
import ExampleSelector from './components/ExampleSelector.vue'
import OutputDisplay from './components/OutputDisplay.vue'
import WebRStatus from './components/WebRStatus.vue'
import LibrarySelector from './components/LibrarySelector.vue'
import { useWebR } from './composables/useWebR'
import { examples } from './data/examples'
import type { RExample, CsvData } from './types'

// Start with the first example (getting-started)
const code = ref(examples[0].code)

const {
  isReady,
  isLoading,
  loadingStatus,
  installedLibraries,
  messages,
  initializeWebR,
  executeCode,
  uploadCsvData,
  clearMessages,
  toggleLibrary,
} = useWebR()

const runCode = async () => {
  if (code.value.trim()) {
    await executeCode(code.value)
  }
}

const handleFileUpload = async (csvData: CsvData) => {
  await uploadCsvData(csvData)
}

const handleFileRemoved = () => {
  // Clear any data-related variables in R
  executeCode('if (exists("data")) rm(data)')
}

const handleExampleSelect = async (example: RExample) => {
  code.value = example.code
  // Auto-execute the selected example
  if (isReady.value && example.code.trim()) {
    await executeCode(example.code)
  }
}

onMounted(() => {
  initializeWebR(code.value)
})
</script>

<template>
  <div id="app">
    <header class="header">
      <h1 class="title">WebR ggplot2 & dplyr Demo</h1>
      <p class="subtitle">Interactive R data visualization and manipulation in the browser</p>
    </header>

    <main class="main">
      <div class="toolbar">
        <div class="toolbar-left">
          <FileUpload @file-uploaded="handleFileUpload" @file-removed="handleFileRemoved" />
          <ExampleSelector @example-selected="handleExampleSelect" />
        </div>
        <div class="toolbar-right">
          <WebRStatus 
            :is-ready="isReady" 
            :is-loading="isLoading" 
            :loading-status="loadingStatus" 
          />
          <LibrarySelector 
            :installed-libraries="installedLibraries" 
            :is-loading="isLoading"
            @toggle-library="toggleLibrary"
          />
        </div>
      </div>

      <div class="container">
        <div class="editor-section">
          <CodeEditor v-model="code" />
          <div class="editor-controls">
            <button @click="runCode" :disabled="!isReady || isLoading" class="run-button">
              {{ isLoading ? 'Running...' : 'Run Code' }}
            </button>
          </div>
        </div>

        <div class="output-section">
          <OutputDisplay
            :messages="messages"
            :is-loading="isLoading"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 0;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
  font-weight: 300;
}


.main {
  flex: 1;
}

.toolbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  height: calc(100vh - 140px);
}


.run-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.run-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.run-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}


.editor-section {
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 1.5rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-controls {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.output-section {
  background: white;
  padding: 1.5rem;
  overflow: hidden;
}


@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .container {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .title {
    font-size: 1.75rem;
  }
}
</style>