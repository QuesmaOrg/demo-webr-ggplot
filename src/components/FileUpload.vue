<script setup lang="ts">
import { ref } from 'vue'
import type { CsvData } from '@/types'

const emit = defineEmits<{
  fileUploaded: [data: CsvData]
  fileRemoved: []
}>()

const fileInputRef = ref<HTMLInputElement>()
const uploadedFile = ref<CsvData | null>(null)

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
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
    const csvData: CsvData = {
      name: file.name,
      content,
    }
    uploadedFile.value = csvData
    emit('fileUploaded', csvData)
  }
  reader.readAsText(file)
}

const removeFile = () => {
  uploadedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emit('fileRemoved')
}
</script>

<template>
  <div class="file-upload">
    <div class="upload-area" @drop="handleDrop" @dragover.prevent @dragenter.prevent>
      <input
        ref="fileInputRef"
        type="file"
        accept=".csv"
        @change="handleFileSelect"
        class="file-input"
      />
      <div class="upload-content">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
        <div class="upload-text">
          <p class="primary-text">Drop CSV file here or click to browse</p>
          <p class="secondary-text">Supported format: .csv</p>
        </div>
      </div>
    </div>
    <div v-if="uploadedFile" class="uploaded-file">
      <div class="file-info">
        <span class="file-name">{{ uploadedFile.name }}</span>
        <button @click="removeFile" class="remove-btn">Remove</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-upload {
  width: 100%;
  margin-bottom: 1rem;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
  position: relative;
}

.upload-area:hover {
  border-color: #3b82f6;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  pointer-events: none;
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  color: #6b7280;
}

.upload-text {
  text-align: center;
}

.primary-text {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.secondary-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.uploaded-file {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f3f4f6;
  border-radius: 4px;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  font-weight: 500;
  color: #374151;
}

.remove-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.remove-btn:hover {
  background-color: #dc2626;
}
</style>