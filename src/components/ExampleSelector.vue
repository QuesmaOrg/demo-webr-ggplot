<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { examples } from '@/data/examples'
import type { RExample } from '@/types'

interface Props {
  compact?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  exampleSelected: [example: RExample]
}>()

// Initialize with the first example's id
const selectedExample = ref<string>(examples[0].id)
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

const currentExample = computed(() => {
  return examples.find((ex) => ex.id === selectedExample.value) || null
})

const handleExampleSelect = (exampleId: string): void => {
  selectedExample.value = exampleId
  isOpen.value = false
  const example = examples.find((ex) => ex.id === exampleId)
  if (example) {
    emit('exampleSelected', example)
  }
}

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
    class="example-selector"
  >
    <button
      class="example-button"
      @click="toggleDropdown"
    >
      <span class="example-text">
        {{ currentExample?.title || 'Select example' }}
      </span>
      <span
        class="dropdown-arrow"
        :class="{ 'open': isOpen }"
      >▼</span>
    </button>
    
    <div
      v-if="isOpen"
      class="example-dropdown"
    >
      <div class="example-list">
        <button
          v-for="example in examples"
          :key="example.id"
          class="example-item"
          :class="{ 'selected': example.id === selectedExample }"
          @click="handleExampleSelect(example.id)"
        >
          <div class="example-info">
            <span class="example-name">{{ example.title }}</span>
            <span class="example-desc">{{ example.description }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.example-selector {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  max-width: 250px;
}

.example-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.375rem 0.625rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 32px;
  width: 100%;
  max-width: 200px;
  justify-content: space-between;
}

.example-button:hover {
  background: #e5e7eb;
  border-color: #3b82f6;
}

.example-text {
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
  margin-left: 0.25rem;
  flex-shrink: 0;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.example-dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 280px;
  max-width: 350px;
  overflow-y: auto;
  max-height: 400px;
}

.example-list {
  padding: 0.375rem;
}

.example-item {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
}

.example-item:hover {
  background: #f3f4f6;
}

.example-item.selected {
  background: #e0f2fe;
}

.example-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  width: 100%;
}

.example-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.example-desc {
  font-size: 0.6875rem;
  color: #6b7280;
  line-height: 1.3;
}

@media (max-width: 768px) {
  .example-selector {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
  }
  
  .example-button {
    max-width: none;
    min-height: 28px;
    padding: 0.25rem 0.5rem;
    font-size: 0.8125rem;
    border-radius: 4px;
    gap: 0.25rem;
  }
  
  .dropdown-arrow {
    font-size: 0.625rem;
  }
  
  .example-dropdown {
    left: 0;
    right: 0;
    max-width: calc(100vw - 2rem);
    z-index: 2000;
  }
}
</style>