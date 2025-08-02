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
  // Clear any data-related variables in R
  void executeCode('if (exists("data")) rm(data)')
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

// Fetch GitHub stars
const fetchGitHubStars = async (): Promise<void> => {
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
          <h1 class="title">
            WebR ggplot2 & dplyr Demo
          </h1>
          <p class="subtitle">
            Interactive R data visualization and manipulation in the browser
          </p>
        </div>
        <a
          href="https://github.com/QuesmaOrg/demo-webr-ggplot"
          target="_blank" 
          rel="noopener noreferrer" 
          class="github-link"
          aria-label="View on GitHub"
        >
          <svg
            class="github-icon"
            :viewBox="icons.github.viewBox"
            width="16"
            height="16"
          >
            <path
              fill="currentColor"
              :d="icons.github.path"
            />
          </svg>
          <span class="github-text">View on GitHub</span>
          <span
            v-if="githubStars !== null"
            class="github-stars"
          >
            <svg
              :viewBox="icons.star.viewBox"
              width="14"
              height="14"
              class="star-icon"
            >
              <path
                fill="currentColor"
                :d="icons.star.path"
              />
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
          <button 
            :disabled="!isReady || isLoading" 
            :class="{ 'has-changes': hasChanges, 'no-changes': !hasChanges }" 
            class="run-button"
            @click="runCode"
          >
            {{ !isReady ? 'Waiting for WebR...' : isLoading ? 'Running...' : 'Run Code' }}
          </button>
          <div
            v-if="isReady && rVersion"
            class="runtime-versions"
          >
            <span>{{ rVersion }}</span>
          </div>
        </div>
        <div class="bottom-bar-right">
          <ConsoleToggle 
            :messages="messages"
            :is-open="consoleRef?.showConsole || false"
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
  gap: 1rem;
}

.runtime-versions {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.runtime-versions:hover {
  opacity: 1;
}

.bottom-bar-right {
  display: flex;
  align-items: center;
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