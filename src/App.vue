<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CodeEditor from './components/CodeEditor.vue'
import FileUpload from './components/FileUpload.vue'
import ExampleSelector from './components/ExampleSelector.vue'
import OutputDisplay from './components/OutputDisplay.vue'
import WebRStatus from './components/WebRStatus.vue'
import LibrarySelector from './components/LibrarySelector.vue'
import { useWebR } from './composables/useWebR'
import { examples } from './data/examples'
import { icons } from './data/icons'
import type { RExample, CsvData } from './types'

// Constants
const GITHUB_REPO_OWNER = 'QuesmaOrg'
const GITHUB_REPO_NAME = 'demo-webr-ggplot'
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`

// Types
interface GitHubRepo {
  stargazers_count: number
  [key: string]: unknown
}

// Start with the first example (getting-started)
const code = ref(examples[0].code)
const lastExecutedCode = ref('')
const hasChanges = computed(() => code.value !== lastExecutedCode.value)

// GitHub stars
const githubStars = ref<number | null>(null)

// Current CSV data state
const currentCsvData = ref<CsvData | null>(null)

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

// Filter text messages for console display
const textMessages = computed(() => {
  return messages.filter(message => message.type !== 'plot')
})

// Console state
const showConsole = ref(false)
const hasErrors = computed(() => {
  return textMessages.value.some(msg => msg.type === 'error' || msg.type === 'stderr')
})

const runCode = async () => {
  if (code.value.trim()) {
    clearMessages() // Clear console and charts before running
    await executeCode(code.value)
    lastExecutedCode.value = code.value
    
    // Auto-open console if no plots were generated
    const hasPlots = messages.some(msg => msg.type === 'plot')
    if (!hasPlots && messages.length > 0) {
      showConsole.value = true
    }
  }
}

const handleFileUpload = async (csvData: CsvData) => {
  currentCsvData.value = csvData
  await uploadCsvData(csvData)
}

const handleFileRemoved = () => {
  currentCsvData.value = null
  // Clear any data-related variables in R
  void executeCode('if (exists("data")) rm(data)')
}

const handleExampleSelect = async (example: RExample) => {
  code.value = example.code
  
  // Wait for WebR to be ready before loading CSV
  if (!isReady.value) {
    console.log('WebR not ready yet, waiting...')
    return
  }
  
  // Load CSV data if the example specifies a csvUrl
  if (example.csvUrl) {
    try {
      const response = await fetch(example.csvUrl)
      if (response.ok) {
        const csvContent = await response.text()
        const parseCsvInfo = (content: string) => {
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
          clearMessages() // Clear console and charts before running
          await executeCode(example.code)
          lastExecutedCode.value = example.code
          
          // Auto-open console if no plots were generated
          const hasPlots = messages.some(msg => msg.type === 'plot')
          if (!hasPlots && messages.length > 0) {
            showConsole.value = true
          }
        }
      }
    } catch (error) {
      console.error('Failed to load CSV for example:', error)
    }
  } else {
    // Execute code immediately for examples without CSV
    if (example.code.trim()) {
      clearMessages() // Clear console and charts before running
      await executeCode(example.code)
      lastExecutedCode.value = example.code
      
      // Auto-open console if no plots were generated
      const hasPlots = messages.some(msg => msg.type === 'plot')
      if (!hasPlots && messages.length > 0) {
        showConsole.value = true
      }
    }
  }
}

// Fetch GitHub stars
const fetchGitHubStars = async () => {
  try {
    const response = await fetch(GITHUB_API_URL)
    if (response.ok) {
      const data = await response.json() as GitHubRepo
      githubStars.value = data.stargazers_count
    }
  } catch (error) {
    console.error('Failed to fetch GitHub stars:', error)
  }
}

onMounted(async () => {
  // Initialize WebR first
  await initializeWebR('')
  // Fetch GitHub stars
  void fetchGitHubStars()
  
  // Execute the first example once WebR is ready
  if (isReady.value && examples.length > 0) {
    await handleExampleSelect(examples[0])
  }
})
</script>

<template>
  <div id="app">
    <header class="header">
      <div class="header-content">
        <div>
          <h1 class="title">WebR ggplot2 & dplyr Demo</h1>
          <p class="subtitle">Interactive R data visualization and manipulation in the browser</p>
        </div>
        <a
          href="https://github.com/QuesmaOrg/demo-webr-ggplot"
          target="_blank" 
          rel="noopener noreferrer" 
          class="github-link"
          aria-label="View on GitHub">
          <svg class="github-icon" :viewBox="icons.github.viewBox" width="16" height="16">
            <path fill="currentColor" :d="icons.github.path" />
          </svg>
          <span class="github-text">View on GitHub</span>
          <span v-if="githubStars !== null" class="github-stars">
            <svg :viewBox="icons.star.viewBox" width="14" height="14" class="star-icon">
              <path fill="currentColor" :d="icons.star.path" />
            </svg>
            {{ githubStars }}
          </span>
        </a>
      </div>
    </header>

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
        </div>

        <div class="output-section">
          <OutputDisplay
            :messages="messages"
            :is-loading="isLoading"
          />
          <!-- Console overlay when expanded -->
          <div v-if="showConsole" class="console-overlay">
            <div class="console-content">
              <div class="console-header">
                <span class="console-title">Console Output</span>
                <button class="console-close" @click="showConsole = false">×</button>
              </div>
              <div class="console-messages">
                <div 
                  v-for="(message, index) in textMessages" 
                  :key="'text-' + index" 
                  class="console-message" 
                  :class="message.type"
                >
                  <span class="message-label">{{ message.type.toUpperCase() }}:</span>
                  <pre 
                    v-if="message.type === 'stdout' || message.type === 'stderr'" 
                    class="message-text"
                  >{{ message.content }}</pre>
                  <span v-else class="message-text">{{ message.content }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Single unified bottom bar -->
      <div class="bottom-bar">
        <div class="bottom-bar-left">
          <button 
            :disabled="!isReady || isLoading" 
            :class="{ 'has-changes': hasChanges, 'no-changes': !hasChanges }" 
            class="run-button"
            @click="runCode"
          >
            {{ isLoading ? 'Running...' : 'Run Code' }}
          </button>
        </div>
        <div class="bottom-bar-right">
          <button 
            v-if="textMessages.length > 0"
            class="console-toggle"
            :class="{ 'has-errors': hasErrors }"
            @click="showConsole = !showConsole"
          >
            Console ({{ textMessages.length }})
            <span class="toggle-arrow" :class="{ 'open': showConsole }">▼</span>
          </button>
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

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
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

.github-link {
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.github-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.github-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.github-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.github-stars {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  padding-left: 0.75rem;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.star-icon {
  width: 14px;
  height: 14px;
  color: #fbbf24;
}


.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
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
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  overflow: hidden;
}


.run-button {
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
  min-width: 80px;
}

.run-button.has-changes {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.run-button.has-changes:hover:not(:disabled) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.run-button.no-changes {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.run-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


.editor-section {
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 1rem;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.output-section {
  background: white;
  padding: 0;
  overflow: auto;
  position: relative;
}

.console-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px 6px 0 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 60%;
}

.console-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.console-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}

.console-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.console-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.console-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  min-height: 120px;
  max-height: 200px;
}

.console-message {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.4;
}

.console-message:last-child {
  margin-bottom: 0;
}

.message-label {
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  min-width: 3rem;
  flex-shrink: 0;
}

.console-message.success .message-label {
  color: #059669;
}

.console-message.error .message-label {
  color: #dc2626;
}

.console-message.stderr .message-label {
  color: #d97706;
}

.console-message.info .message-label {
  color: #2563eb;
}

.message-text {
  flex: 1;
  margin: 0;
  font-family: 'Courier New', monospace;
  color: #374151;
  white-space: pre-wrap;
}

/* Bottom bar styling */
.bottom-bar {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
  height: 60px;
  flex-shrink: 0;
}

.bottom-bar-left {
  display: flex;
  align-items: center;
}

.bottom-bar-right {
  display: flex;
  align-items: center;
}

.console-toggle {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.console-toggle:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.console-toggle.has-errors {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.toggle-arrow {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

.toggle-arrow.open {
  transform: rotate(180deg);
}


@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .bottom-bar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    height: auto;
    padding: 1rem;
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