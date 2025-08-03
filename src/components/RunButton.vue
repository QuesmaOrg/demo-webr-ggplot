<script setup lang="ts">
interface Props {
  isReady: boolean
  isLoading: boolean
  hasChanges: boolean
  rVersion?: string
}

interface Emits {
  (e: 'run'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClick = (): void => {
  emit('run')
}
</script>

<template>
  <div class="run-section">
    <button 
      :disabled="!isReady || isLoading" 
      :class="{ 'has-changes': hasChanges, 'no-changes': !hasChanges }" 
      class="run-button"
      @click="handleClick"
    >
      {{ !isReady ? 'Waiting for WebR...' : isLoading ? 'Running...' : 'Run Code' }}
    </button>
    <div
      v-if="isReady && rVersion"
      class="runtime-versions"
    >
      <span>{{ rVersion }}</span>
    </div>
  </div>
</template>

<style scoped>
.run-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.run-button {
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
  min-width: 80px;
}

.run-button.has-changes {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.run-button.has-changes:hover:not(:disabled) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.run-button.no-changes {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.run-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.runtime-versions {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.runtime-versions:hover {
  opacity: 1;
}
</style>