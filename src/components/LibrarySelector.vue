<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  installedLibraries: Set<string>
  isLoading: boolean
  isReady?: boolean
  packageVersions: Record<string, string>
  showStatus?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggleLibrary: [library: string, install: boolean]
}>()

const isOpen = ref(false)

const availableLibraries = [
  { name: 'tidyverse', description: 'Complete data science toolkit' },
  { name: 'ggplot2', description: 'Create elegant data visualizations' },
  { name: 'dplyr', description: 'Fast data manipulation with verbs' },
  { name: 'tidyr', description: 'Reshape and tidy messy data' },
  { name: 'ggrepel', description: 'Automatically position text labels' },
  { name: 'ggthemes', description: 'Professional themes & color palettes' },
  { name: 'lubridate', description: 'Work with dates and times easily' },
  { name: 'zoo', description: 'Handle irregular time series data' }
]

const handleToggle = (library: string, event: Event): void => {
  const target = event.target as HTMLInputElement
  emit('toggleLibrary', library, target.checked)
}

const dropdownRef = ref<HTMLElement>()

const toggleDropdown = (): void => {
  isOpen.value = !isOpen.value
}

const handleClickOutside = (event: MouseEvent): void => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="dropdownRef"
    class="library-selector"
  >
    <button 
      class="libraries-button"
      :class="{ 
        'status-loading': showStatus && isLoading,
        'status-ready': showStatus && isReady && !isLoading
      }"
      @click="toggleDropdown"
    >
      <span 
        v-if="isLoading && showStatus" 
        class="status-spinner"
      />
      <span class="libraries-text">
        <span v-if="showStatus && isLoading">WebR...</span>
        <span v-else-if="showStatus && isReady">WebR</span>
        <span v-else-if="showStatus">WebR</span>
        <span v-else>Libraries</span>
      </span>
      <span
        class="dropdown-arrow"
        :class="{ 'open': isOpen }"
      >▼</span>
    </button>
    
    <div
      v-if="isOpen"
      class="libraries-dropdown"
    >
      <div class="libraries-list">
        <label 
          v-for="library in availableLibraries" 
          :key="library.name" 
          class="library-item"
          :class="{ 'disabled': isLoading }"
        >
          <input 
            type="checkbox" 
            :checked="installedLibraries.has(library.name)"
            :disabled="isLoading"
            class="library-checkbox"
            @change="handleToggle(library.name, $event)"
          >
          <div class="library-info">
            <div class="library-name-row">
              <span class="library-name">{{ library.name }}</span>
              <span
                v-if="installedLibraries.has(library.name) && packageVersions[library.name]" 
                class="library-version"
              >v{{ packageVersions[library.name] }}</span>
            </div>
            <span class="library-desc">{{ library.description }}</span>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.library-selector {
  position: relative;
  display: flex;
  align-items: center;
}

.libraries-button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.375rem 0.625rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 32px;
}

.libraries-button:hover {
  background: #e5e7eb;
  border-color: #3b82f6;
}

.libraries-button.status-loading {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.libraries-button.status-ready {
  background: #ecfdf5;
  border-color: #10b981;
  color: #065f46;
}

.status-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #f59e0b;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.libraries-icon {
  font-size: 0.875rem;
}

.dropdown-arrow {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.libraries-dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 220px;
  overflow-y: auto;
}

.libraries-header {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.header-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.libraries-list {
  padding: 0.375rem;
}

.library-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.library-item:hover:not(.disabled) {
  background: #f3f4f6;
}

.library-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.library-checkbox {
  margin: 0;
  margin-top: 2px;
  cursor: pointer;
  flex-shrink: 0;
}

.library-checkbox:disabled {
  cursor: not-allowed;
}

.library-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.library-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 1.2em;
}

.library-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.library-version {
  font-size: 0.6875rem;
  color: #059669;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-weight: 500;
  white-space: nowrap;
}

.library-desc {
  font-size: 0.6875rem;
  color: #6b7280;
  line-height: 1.3;
}

/* Mobile styles */
@media (max-width: 768px) {
  .library-selector {
    display: flex;
    align-items: center;
  }
  
  .libraries-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.8125rem;
    min-height: 28px;
    border-radius: 4px;
    gap: 0.25rem;
    margin-left: auto;
  }
  
  .libraries-text {
    font-weight: 500;
  }
  
  .status-spinner {
    width: 10px;
    height: 10px;
  }
  
  .dropdown-arrow {
    font-size: 0.625rem;
  }
  
  .libraries-dropdown {
    overflow-y: auto;
    z-index: 2000;
  }
}
</style>