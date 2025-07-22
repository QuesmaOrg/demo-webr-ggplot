<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
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

const handlePlotLoad = () => {
  console.log('Plot loaded successfully')
  scrollToBottom()
}

const handlePlotError = (event: Event) => {
  console.error('Plot load error:', event)
}

const plotMessages = computed(() => {
  return props.messages.filter(message => message.type === 'plot')
})

const textMessages = computed(() => {
  return props.messages.filter(message => message.type !== 'plot')
})

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
    <div class="output-content" ref="outputRef">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <span>Running R code...</span>
      </div>
      
      <div v-if="messages.length === 0 && !isLoading" class="empty-state">
        <p>Run some R code to see the output here</p>
      </div>
      
      <!-- Display all plots first -->
      <div v-for="(message, index) in plotMessages" :key="'plot-' + index" class="message">
        <div class="plot-container">
          <img 
            :src="message.content" 
            alt="R plot" 
            class="plot-image"
            @load="handlePlotLoad"
            @error="handlePlotError"
          />
        </div>
      </div>
      
      <!-- Single foldable bar for all text output -->
      <details v-if="textMessages.length > 0" class="text-output" open>
        <summary class="output-summary">Console Output ({{ textMessages.length }})</summary>
        <div class="output-text">
          <div v-for="(message, index) in textMessages" :key="'text-' + index" class="text-message" :class="message.type">
            <div class="message-type">{{ message.type.toUpperCase() }}:</div>
            <pre v-if="message.type === 'stdout' || message.type === 'stderr'" class="message-content">{{ message.content }}</pre>
            <div v-else class="message-content">{{ message.content }}</div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.output-display {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.output-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
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

.text-output {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
}

.output-summary {
  padding: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  user-select: none;
}

.output-summary:hover {
  background-color: #e5e7eb;
}

.output-text {
  margin: 0;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  color: #374151;
  background-color: #fff;
}

.message-other {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
}

.message-other.success {
  border-left: 4px solid #22c55e;
  background-color: #f0fdf4;
}

.message-other.error {
  border-left: 4px solid #ef4444;
  background-color: #fef2f2;
}

.message-other.warning {
  border-left: 4px solid #f59e0b;
  background-color: #fffbeb;
}

.message-type {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

.plot-container {
  text-align: center;
  padding: 1rem;
  background-color: white;
  border-radius: 4px;
  margin: 0.5rem 0;
}

.plot-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: white;
  display: block;
  margin: 0 auto;
}

.text-message {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.text-message:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.text-message .message-type {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  min-width: 4rem;
  flex-shrink: 0;
}

.text-message.success .message-type {
  color: #059669;
}

.text-message.error .message-type {
  color: #dc2626;
}

.text-message.warning .message-type {
  color: #d97706;
}

.text-message.stderr .message-type {
  color: #d97706;
}

.text-message .message-content {
  flex: 1;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  color: #374151;
}
</style>