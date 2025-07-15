<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CodeEditor from './components/CodeEditor.vue'
import FileUpload from './components/FileUpload.vue'
import ExampleSelector from './components/ExampleSelector.vue'
import OutputDisplay from './components/OutputDisplay.vue'
import { useWebR } from './composables/useWebR'
import type { RExample, CsvData } from './types'

const code = ref(`# Welcome to WebR ggplot2 & dplyr Demo!
# Select an example from the dropdown or write your own R code

library(ggplot2)
library(dplyr)

# Basic example with built-in data
mtcars %>%
  head(10) %>%
  print()`)

const {
  isReady,
  isLoading,
  messages,
  initializeWebR,
  executeCode,
  uploadCsvData,
  clearMessages,
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

const handleExampleSelect = (example: RExample) => {
  code.value = example.code
}

onMounted(() => {
  initializeWebR()
})
</script>

<template>
  <div id="app">
    <header class="header">
      <h1 class="title">WebR ggplot2 & dplyr Demo</h1>
      <p class="subtitle">Interactive R data visualization and manipulation in the browser</p>
    </header>

    <main class="main">
      <div class="container">
        <div class="sidebar">
          <div class="controls">
            <FileUpload @file-uploaded="handleFileUpload" @file-removed="handleFileRemoved" />
            <ExampleSelector @example-selected="handleExampleSelect" />
            <button @click="runCode" :disabled="!isReady || isLoading" class="run-button">
              {{ isLoading ? 'Running...' : 'Run Code' }}
            </button>
          </div>
        </div>

        <div class="content">
          <div class="editor-section">
            <div class="section-header">
              <h2 class="section-title">R Code Editor</h2>
            </div>
            <CodeEditor v-model="code" />
          </div>

          <div class="output-section">
            <OutputDisplay
              :messages="messages"
              :is-loading="isLoading"
              @clear="clearMessages"
            />
          </div>
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
  padding: 2rem 0;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0;
  font-size: 2.5rem;
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

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  align-items: start;
}

.sidebar {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.run-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
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

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.editor-section,
.output-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}
</style>