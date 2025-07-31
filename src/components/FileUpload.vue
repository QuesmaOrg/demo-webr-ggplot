<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { CsvData } from '@/types'

const props = defineProps<{
  uploadedFile?: CsvData | null
}>()

const emit = defineEmits<{
  fileUploaded: [data: CsvData]
  fileRemoved: []
}>()

const fileInputRef = ref<HTMLInputElement>()
const isOpen = ref(false)
const isDragging = ref(false)
const dropdownRef = ref<HTMLElement>()
const showUrlInput = ref(false)
const urlInput = ref('')

const parseCsvInfo = (content: string): { rows: number; columns: number; columnNames: string[] } => {
  const lines = content.trim().split('\n')
  const columnNames = lines[0].split(',').map(name => name.trim().replace(/^"|"$/g, ''))
  return {
    rows: lines.length - 1, // Exclude header row
    columns: columnNames.length,
    columnNames
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processFile(target.files[0])
  }
}

const processFile = (file: File) => {
  if (!file.name.endsWith('.csv')) {
    alert('Please select a CSV file')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const { rows, columns, columnNames } = parseCsvInfo(content)
    const csvData: CsvData = {
      name: file.name,
      content,
      rows,
      columns,
      columnNames
    }
    emit('fileUploaded', csvData)
  }
  reader.readAsText(file)
}

const loadFromUrl = async () => {
  if (!urlInput.value.trim()) {
    return
  }
  
  try {
    const response = await fetch(urlInput.value)
    if (!response.ok) {
      alert('Failed to load CSV from URL')
      return
    }
    
    const content = await response.text()
    const { rows, columns, columnNames } = parseCsvInfo(content)
    const csvData: CsvData = {
      name: urlInput.value.split('/').pop() || 'data.csv',
      content,
      rows,
      columns,
      columnNames
    }
    showUrlInput.value = false
    urlInput.value = ''
    emit('fileUploaded', csvData)
  } catch (error) {
    console.error('Error loading CSV from URL:', error)
    alert('Error loading CSV from URL')
  }
}

const removeFile = () => {
  isOpen.value = false
  showUrlInput.value = false
  urlInput.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emit('fileRemoved')
}

const toggleDropdown = () => {
  if (props.uploadedFile) {
    isOpen.value = !isOpen.value
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="file-upload">
    <div
      v-if="!props.uploadedFile" class="csv-drop-zone" 
      :class="{ 'dragging': isDragging }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      
      <!-- URL Input Section (when active) -->
      <div v-if="showUrlInput" class="url-input-section">
        <input 
          v-model="urlInput"
          type="url"
          placeholder="Enter CSV URL (e.g., https://example.com/data.csv)"
          class="url-input"
          @keyup.enter="loadFromUrl"
        />
        <button class="thin-btn primary" @click="loadFromUrl">Load</button>
        <button class="thin-btn" @click="showUrlInput = false">Cancel</button>
      </div>
      
      <!-- Default CSV upload options -->
      <div v-else class="csv-options">
        <input
          ref="fileInputRef"
          type="file"
          accept=".csv"
          class="file-input"
          style="display: none;"
          @change="handleFileSelect"
        />
        <span class="drop-text">Drop CSV here</span>
        <button class="thin-btn" @click="fileInputRef?.click()">
          or upload file
        </button>
        <button class="thin-btn" @click="showUrlInput = true">
          or load from URL
        </button>
      </div>
    </div>
    
    <div v-else class="csv-info-container">
      <button 
        class="csv-button"
        @click="toggleDropdown"
      >
        <span class="csv-text">
          {{ props.uploadedFile.name }} ({{ props.uploadedFile.rows }} × {{ props.uploadedFile.columns }})
        </span>
        <span class="dropdown-arrow" :class="{ 'open': isOpen }">▼</span>
      </button>
      
      <div v-if="isOpen" class="csv-dropdown">
        <div class="csv-header">
          <span class="header-text">CSV Information</span>
          <button class="remove-btn" title="Remove file" @click="removeFile">×</button>
        </div>
        <div class="csv-details">
          <div class="detail-item">
            <span class="detail-label">File:</span>
            <span class="detail-value">{{ props.uploadedFile.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Rows:</span>
            <span class="detail-value">{{ props.uploadedFile.rows.toLocaleString() }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Columns:</span>
            <span class="detail-value">{{ props.uploadedFile.columns }}</span>
          </div>
          <div class="columns-section">
            <span class="columns-header">Column Names:</span>
            <div class="columns-list">
              <span 
                v-for="(col, index) in props.uploadedFile.columnNames" 
                :key="index"
                class="column-name"
              >
                {{ col }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-upload {
  position: relative;
  display: flex;
  align-items: center;
}

.csv-drop-zone {
  background: #fafafa;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  transition: all 0.3s ease;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.csv-drop-zone:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.csv-drop-zone.dragging {
  background: #dbeafe;
  border-color: #3b82f6;
  border-style: solid;
}

.csv-options {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.drop-text {
  color: #000000;
  font-size: 0.875rem;
  margin-right: 0.25rem;
}

.thin-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.thin-btn:hover {
  background: #f3f4f6;
  border-color: #3b82f6;
}

.thin-btn.primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.thin-btn.primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.url-input-section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
}

.url-input {
  flex: 1;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 200px;
}

.url-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}


.csv-info-container {
  position: relative;
}

.csv-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.csv-button:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}


.csv-text {
  font-weight: 500;
  color: #374151;
}

.dropdown-arrow {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
  margin-left: 0.25rem;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.csv-dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 280px;
}

.csv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.header-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.remove-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  font-size: 1.25rem;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #f3f4f6;
  color: #ef4444;
}

.csv-details {
  padding: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.detail-label {
  font-weight: 500;
  color: #6b7280;
  min-width: 60px;
}

.detail-value {
  color: #374151;
}

.columns-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.columns-header {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  display: block;
  margin-bottom: 0.5rem;
}

.columns-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.column-name {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #374151;
  font-family: monospace;
}
</style>