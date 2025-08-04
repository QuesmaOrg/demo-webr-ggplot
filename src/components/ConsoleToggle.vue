<script setup lang="ts">
import { computed } from 'vue'
import type { WebRMessage } from '../types'

interface Props {
  messages: WebRMessage[]
  isOpen: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'toggle'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Filter text messages for console display
const textMessages = computed(() => {
  return props.messages.filter(message => message.type !== 'plot')
})

const errorCount = computed(() => {
  return textMessages.value.filter(msg => msg.type === 'error' || msg.type === 'stderr').length
})

const infoCount = computed(() => {
  return textMessages.value.filter(msg => 
    msg.type === 'stdout' || msg.type === 'info' || msg.type === 'success'
  ).length
})

const warningCount = computed(() => {
  return textMessages.value.filter(msg => msg.type === 'warning').length
})

const hasErrors = computed(() => {
  return errorCount.value > 0
})

const hasWarnings = computed(() => {
  return warningCount.value > 0
})

const buttonText = computed(() => {
  if (props.isLoading) return 'Running...'
  
  const parts = []
  if (infoCount.value > 0) parts.push(`${infoCount.value} info`)
  if (warningCount.value > 0) parts.push(`${warningCount.value} warning${warningCount.value > 1 ? 's' : ''}`)
  if (errorCount.value > 0) parts.push(`${errorCount.value} error${errorCount.value > 1 ? 's' : ''}`)
  
  if (parts.length === 0) return 'Console (empty)'
  return `Console: ${parts.join(', ')}`
})

const toggleConsole = (): void => {
  if (!props.isLoading) {
    emit('toggle')
  }
}
</script>

<template>
  <button 
    class="console-toggle"
    :class="{ 
      'has-errors': hasErrors, 
      'has-warnings': hasWarnings && !hasErrors,
      'is-loading': isLoading
    }"
    :disabled="isLoading"
    @click="toggleConsole"
  >
    {{ buttonText }}
    <span
      v-if="!isLoading"
      class="toggle-arrow"
      :class="{ 'open': isOpen }"
    >▼</span>
  </button>
</template>

<style scoped>
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

.console-toggle.has-warnings {
  background: #fefbf2;
  border-color: #fed7aa;
  color: #d97706;
}

.console-toggle.is-loading {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.console-toggle:disabled {
  opacity: 0.7;
}

.toggle-arrow {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

.toggle-arrow.open {
  transform: rotate(180deg);
}
</style>