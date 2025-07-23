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

const latestPlot = computed(() => {
  const plots = props.messages.filter(message => message.type === 'plot')
  return plots.length > 0 ? plots[plots.length - 1] : null
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
      
      <!-- Display latest chart prominently -->
      <div v-if="latestPlot" class="chart-display">
        <img 
          :src="latestPlot.content" 
          alt="R plot" 
          class="chart-image"
          @load="handlePlotLoad"
          @error="handlePlotError"
        />
      </div>
      
      <!-- Minimized console output at bottom -->
      <details v-if="textMessages.length > 0" class="console-output">
        <summary class="console-summary">
          <span class="console-icon">📜</span>
          Console ({{ textMessages.length }})
        </summary>
        <div class="console-content">
          <div v-for="(message, index) in textMessages" :key="'text-' + index" class="console-message" :class="message.type">
            <span class="message-label">{{ message.type.toUpperCase() }}:</span>
            <pre v-if="message.type === 'stdout' || message.type === 'stderr'" class="message-text">{{ message.content }}</pre>
            <span v-else class="message-text">{{ message.content }}</span>
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
  padding: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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

.chart-display {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem;
  background: #fff;
}

.chart-image {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.console-output {
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  margin-top: auto;
}

.console-summary {
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #f3f4f6;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.console-summary:hover {
  background-color: #e5e7eb;
}

.console-icon {
  font-size: 0.875rem;
}

.console-content {
  max-height: 200px;
  overflow-y: auto;
  padding: 0.75rem;
  background-color: #fff;
  border-top: 1px solid #e5e7eb;
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


</style>