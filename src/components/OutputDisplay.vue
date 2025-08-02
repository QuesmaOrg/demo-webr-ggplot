<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
import type { WebRMessage } from '@/types'

interface Props {
  messages: WebRMessage[]
  isLoading: boolean
  showConsoleBelow?: boolean
}

const props = defineProps<Props>()

const outputRef = ref<HTMLElement>()

const scrollToBottom = (): void => {
  void nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight
    }
  })
}

const handlePlotLoad = (): void => {
  // Plot loaded successfully - no need to log this normal behavior
  scrollToBottom()
}

const handlePlotError = (event: Event): void => {
  console.error('Plot load error:', event)
}

const latestPlot = computed(() => {
  const plots = props.messages.filter(message => message.type === 'plot')
  return plots.length > 0 ? plots[plots.length - 1] : null
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
    <div
      ref="outputRef"
      class="output-content"
    >
      <div
        v-if="messages.length === 0 && !isLoading"
        class="empty-state"
      >
        <p>Run some R code to see the output here</p>
      </div>
      
      <!-- Display latest chart prominently -->
      <div
        v-if="latestPlot"
        class="chart-display"
      >
        <img 
          :src="latestPlot.content" 
          alt="R plot" 
          class="chart-image"
          @load="handlePlotLoad"
          @error="handlePlotError"
        >
      </div>
      
      <!-- Loading overlay -->
      <div
        v-if="isLoading"
        class="loading-overlay"
      >
        <div class="loading-content">
          <div class="spinner" />
          <span>Executing R code...</span>
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
  background-color: #fff;
}

.output-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(1px);
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #374151;
  font-weight: 500;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.spinner {
  width: 20px;
  height: 20px;
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
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #fff;
  min-height: 0;
  overflow: hidden;
}

.chart-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.console-section {
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  margin-top: auto;
}

.console-summary {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #f9fafb;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  min-height: 20px;
}

.console-summary:hover {
  background-color: #f3f4f6;
}

.console-title {
  font-weight: 600;
  text-transform: uppercase;
}

.console-count {
  color: #9ca3af;
}

.console-arrow {
  margin-left: auto;
  font-size: 0.625rem;
  transition: transform 0.3s ease;
}

.console-section[open] .console-arrow {
  transform: rotate(180deg);
}

.console-messages {
  max-height: 150px;
  overflow-y: auto;
  padding: 0.5rem;
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