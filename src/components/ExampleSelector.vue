<script setup lang="ts">
import { ref, computed } from 'vue'
import { examples } from '@/data/examples'
import type { RExample } from '@/types'

const emit = defineEmits<{
  exampleSelected: [example: RExample]
}>()

// Initialize with the first example's id
const selectedExample = ref<string>(examples[0].id)

const currentExample = computed(() => {
  return examples.find((ex) => ex.id === selectedExample.value) || null
})

const handleExampleChange = (): void => {
  if (currentExample.value) {
    emit('exampleSelected', currentExample.value)
  }
}
</script>

<template>
  <div class="example-selector">
    <select
      id="example-select"
      v-model="selectedExample"
      class="select"
      @change="handleExampleChange"
    >
      <option
        v-for="example in examples"
        :key="example.id"
        :value="example.id"
      >
        {{ example.title }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.example-selector {
  display: flex;
  align-items: center;
}

.select {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.select:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}


.select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>