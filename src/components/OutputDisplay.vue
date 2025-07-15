<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { WebRMessage } from '@/types'

interface Props {
  messages: WebRMessage[]
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  clear: []
}>()

const outputRef = ref<HTMLElement>()

const clearOutput = () => {
  emit('clear')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight
    }
  })
}

watch(
  () => props.messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
)
</script>

<template>
  <div class="output-display">
    <div class="output-header">
      <h3 class="output-title">Output</h3>
      <button v-if="messages.length > 0" @click="clearOutput" class="clear-btn">
        Clear
      </button>
    </div>
    
    <div class="output-content" ref="outputRef">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <span>Running R code...</span>
      </div>
      
      <div v-if="messages.length === 0 && !isLoading" class="empty-state">
        <p>Run some R code to see the output here</p>
      </div>
      
      <div v-for="(message, index) in messages" :key="index" class="message" :class="message.type">
        <div class="message-type">{{ message.type.toUpperCase() }}</div>
        <div class="message-content">
          <pre v-if="message.type === 'stdout' || message.type === 'stderr'">{{ message.content }}</pre>
          <div v-else-if="message.type === 'plot'" class="plot-container">
            <img :src="message.content" alt="R plot" class="plot-image" />
          </div>
          <div v-else class="message-text">{{ message.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.output-display {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #fff;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.output-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.clear-btn {
  padding: 0.25rem 0.75rem;
  background-color: #6b7280;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.clear-btn:hover {
  background-color: #4b5563;
}

.output-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  max-height: 500px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-style: italic;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  margin-top: 2rem;
}

.message {
  margin-bottom: 1rem;
  border-radius: 4px;
  overflow: hidden;
}

.message.stdout {
  border-left: 4px solid #10b981;
}

.message.stderr {
  border-left: 4px solid #f59e0b;
}

.message.error {
  border-left: 4px solid #ef4444;
}

.message.success {
  border-left: 4px solid #22c55e;
}

.message.plot {
  border-left: 4px solid #3b82f6;
}

.message-type {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.25rem 0.5rem;
  background-color: #f3f4f6;
  color: #6b7280;
}

.message-content {
  padding: 0.5rem;
  background-color: #f9fafb;
}

.message-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  color: #374151;
}

.plot-container {
  text-align: center;
  padding: 1rem;
  background-color: white;
}

.plot-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}
</style>