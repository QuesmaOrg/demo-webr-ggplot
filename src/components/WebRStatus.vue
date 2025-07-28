<script setup lang="ts">
interface Props {
  isReady: boolean
  isLoading: boolean
  loadingStatus: string
}

defineProps<Props>()
</script>

<template>
  <div class="webr-status">
    <div class="status-indicator" :class="{ 'loading': isLoading, 'ready': isReady && !isLoading, 'error': !isReady && !isLoading && loadingStatus.includes('Failed') }">
      <div v-if="isLoading" class="spinner"></div>
      <span v-else-if="isReady" class="status-icon">✓</span>
      <span v-else-if="loadingStatus.includes('Failed')" class="status-icon">✗</span>
      <span v-else class="status-icon">⚙️</span>
      <span class="status-text">{{ loadingStatus || 'WebR' }}</span>
    </div>
  </div>
</template>

<style scoped>
.webr-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  transition: all 0.3s ease;
}

.status-indicator.loading {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.status-indicator.ready {
  background: #ecfdf5;
  border-color: #10b981;
  color: #065f46;
}

.status-indicator.error {
  background: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
}

.status-icon {
  font-size: 0.875rem;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #f59e0b;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-text {
  white-space: nowrap;
}
</style>