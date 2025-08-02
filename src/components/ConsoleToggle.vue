<script setup lang="ts">
import { computed } from 'vue'
import type { WebRMessage } from '../types'

interface Props {
  messages: WebRMessage[]
  isOpen: boolean
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

const hasErrors = computed(() => {
  return textMessages.value.some(msg => msg.type === 'error' || msg.type === 'stderr')
})

const hasWarnings = computed(() => {
  return textMessages.value.some(msg => msg.type === 'warning')
})

const toggleConsole = (): void => {
  emit('toggle')
}
</script>

<template>
  <button 
    class="console-toggle"
    :class="{ 'has-errors': hasErrors, 'has-warnings': hasWarnings && !hasErrors }"
    @click="toggleConsole"
  >
    Console ({{ textMessages.length }})
    <span
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

.toggle-arrow {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

.toggle-arrow.open {
  transform: rotate(180deg);
}
</style>