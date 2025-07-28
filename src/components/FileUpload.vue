<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { CsvData } from '@/types'

const emit = defineEmits<{
  fileUploaded: [data: CsvData]
  fileRemoved: []
}>()

const fileInputRef = ref<HTMLInputElement>()
const uploadedFile = ref<CsvData | null>(null)
const isOpen = ref(false)
const isDragging = ref(false)
const dropdownRef = ref<HTMLElement>()

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
    uploadedFile.value = csvData
    emit('fileUploaded', csvData)
  }
  reader.readAsText(file)
}

const removeFile = () => {
  uploadedFile.value = null
  isOpen.value = false
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emit('fileRemoved')
}

const toggleDropdown = () => {
  if (uploadedFile.value) {
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
  <div class="file-upload" ref="dropdownRef">
    <div 
      v-if="!uploadedFile" 
      class="upload-button"
      :class="{ 'dragging': isDragging }"
      @click="fileInputRef?.click()"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept=".csv"
        @change="handleFileSelect"
        class="file-input"
        style="display: none;"
      />
      <span class="upload-icon">📁</span>
      <span class="upload-text">Upload CSV</span>
      <span class="drag-hint">or drop file here</span>
    </div>
    
    <div v-else class="csv-info-container">
      <button 
        @click="toggleDropdown"
        class="csv-button"
      >
        <span class="csv-icon">📊</span>
        <span class="csv-text">{{ uploadedFile.name }} ({{ uploadedFile.rows }} × {{ uploadedFile.columns }})</span>
        <span class="dropdown-arrow" :class="{ 'open': isOpen }">▼</span>
      </button>
      
      <div v-if="isOpen" class="csv-dropdown">
        <div class="csv-header">
          <span class="header-text">CSV Information</span>
          <button @click="removeFile" class="remove-btn" title="Remove file">×</button>
        </div>
        <div class="csv-details">
          <div class="detail-item">
            <span class="detail-label">File:</span>
            <span class="detail-value">{{ uploadedFile.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Rows:</span>
            <span class="detail-value">{{ uploadedFile.rows.toLocaleString() }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Columns:</span>
            <span class="detail-value">{{ uploadedFile.columns }}</span>
          </div>
          <div class="columns-section">
            <span class="columns-header">Column Names:</span>
            <div class="columns-list">
              <span 
                v-for="(col, index) in uploadedFile.columnNames" 
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

.upload-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.upload-button:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.upload-button.dragging {
  background: #dbeafe;
  border-color: #3b82f6;
  border-style: solid;
}

.upload-icon {
  font-size: 0.875rem;
}

.upload-text {
  font-weight: 500;
}

.drag-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 0.25rem;
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

.csv-icon {
  font-size: 0.875rem;
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