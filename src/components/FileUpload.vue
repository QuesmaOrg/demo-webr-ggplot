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
    <div v-if="!uploadedFile" class="upload-button" @click="$refs.fileInputRef?.click()">
      <input
        ref="fileInputRef"
        type="file"
        accept=".csv"
        @change="handleFileSelect"
        class="file-input"
        style="display: none;"
      />
      📁 Upload Data
    </div>
    <div v-else class="uploaded-file">
      <span class="file-name">📄 {{ uploadedFile.name }}</span>
      <button @click="removeFile" class="remove-btn">×</button>
    </div>
  </div>
</template>

<style scoped>
.file-upload {
  display: flex;
  align-items: center;
}

.upload-button {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
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

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ecfdf5;
  border: 1px solid #d1fae5;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.file-name {
  color: #065f46;
  font-weight: 500;
}

.remove-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #f3f4f6;
  color: #374151;
}
</style>