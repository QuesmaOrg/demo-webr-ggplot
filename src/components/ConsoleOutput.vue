<script setup lang="ts">
import { ref, computed } from 'vue'
import type { WebRMessage } from '../types'

interface Props {
  messages: WebRMessage[]
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Console state (internal to this component)
const showConsole = ref(false)

// Filter text messages for console display
const textMessages = computed(() => {
  return props.messages.filter(message => message.type !== 'plot')
})


// Group consecutive messages of the same type for cleaner display
const groupedMessages = computed(() => {
  const groups: Array<{type: string, content: string, showLabel: boolean}> = []
  
  for (const message of textMessages.value) {
    const lastGroup = groups[groups.length - 1]
    
    // Clean up excessive line breaks from the message content
    const cleanContent = message.content.replace(/\n\s*\n\s*\n/g, '\n').trim()
    
    if (lastGroup && lastGroup.type === message.type) {
      // Same type as previous - append content with single line break
      lastGroup.content += '\n' + cleanContent
    } else {
      // New type - create new group
      const showLabel = message.type !== 'stdout' // Don't show label for stdout
      groups.push({
        type: message.type,
        content: cleanContent,
        showLabel
      })
    }
  }
  
  return groups
})

const toggleConsole = (): void => {
  showConsole.value = !showConsole.value
}

const closeConsole = (): void => {
  showConsole.value = false
  emit('close')
}

// Auto-open console when there are messages but no plots
const autoOpenConsole = (): void => {
  const hasPlots = props.messages.some(msg => msg.type === 'plot')
  if (!hasPlots && props.messages.length > 0) {
    showConsole.value = true
  }
}

// Expose methods for parent components
defineExpose({
  autoOpenConsole,
  toggleConsole,
  showConsole: computed(() => showConsole.value)
})
</script>

<template>
  <!-- Console overlay when expanded -->
  <div
    v-if="showConsole"
    class="console-overlay"
  >
    <div class="console-content">
      <div class="console-header">
        <span class="console-title">Console Output</span>
        <button
          class="console-close"
          @click="closeConsole"
        >
          ×
        </button>
      </div>
      <div class="console-messages">
        <div 
          v-for="(group, index) in groupedMessages" 
          :key="'group-' + index" 
          class="console-message" 
          :class="[group.type, { 'no-label': !group.showLabel }]"
        >
          <span
            v-if="group.showLabel"
            class="message-label"
          >{{ group.type.toUpperCase() }}:</span>
          <pre 
            v-if="group.type === 'stdout' || group.type === 'stderr'" 
            class="message-text"
          >{{ group.content }}</pre>
          <span
            v-else
            class="message-text"
          >{{ group.content }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.console-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px 6px 0 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 60%;
}

.console-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.console-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}

.console-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.console-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.console-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  min-height: 120px;
  max-height: 200px;
}

.console-message {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.4;
}

.console-message.no-label {
  gap: 0;
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

.console-message.warning .message-label {
  color: #d97706;
}

.message-text {
  flex: 1;
  margin: 0;
  font-family: 'Courier New', monospace;
  color: #374151;
  white-space: pre-wrap;
}
</style>