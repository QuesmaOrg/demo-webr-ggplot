<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  installedLibraries: Set<string>
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggleLibrary: [library: string, install: boolean]
}>()

const isOpen = ref(false)

const availableLibraries = [
  { name: 'ggplot2', description: 'Grammar of graphics' },
  { name: 'dplyr', description: 'Data manipulation' },
  { name: 'ggrepel', description: 'Repel text labels' },
  { name: 'tidyr', description: 'Tidy messy data' },
  { name: 'readr', description: 'Read rectangular data' }
]

const installedCount = computed(() => props.installedLibraries.size)

const handleToggle = (library: string, event: Event) => {
  const target = event.target as HTMLInputElement
  emit('toggleLibrary', library, target.checked)
}

const dropdownRef = ref<HTMLElement>()

const toggleDropdown = () => {
  if (!props.isLoading) {
    isOpen.value = !isOpen.value
  }
}

const handleClickOutside = (event: MouseEvent) => {
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
  <div class="library-selector" ref="dropdownRef">
    <button 
      @click="toggleDropdown"
      :disabled="isLoading"
      class="libraries-button"
      :class="{ 'disabled': isLoading }"
    >
      <span class="libraries-icon">📚</span>
      <span class="libraries-text">Libraries ({{ installedCount }})</span>
      <span class="dropdown-arrow" :class="{ 'open': isOpen }">▼</span>
    </button>
    
    <div v-if="isOpen" class="libraries-dropdown">
      <div class="libraries-header">
        <span class="header-text">Available Libraries</span>
      </div>
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
            @change="handleToggle(library.name, $event)"
            class="library-checkbox"
          />
          <div class="library-info">
            <span class="library-name">{{ library.name }}</span>
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
  gap: 0.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.libraries-button:hover:not(.disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.libraries-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 240px;
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
  padding: 0.5rem;
}

.library-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
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
  cursor: pointer;
}

.library-checkbox:disabled {
  cursor: not-allowed;
}

.library-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.library-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.library-desc {
  font-size: 0.75rem;
  color: #6b7280;
}
</style>