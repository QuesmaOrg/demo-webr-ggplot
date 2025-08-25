<script setup lang="ts">
import { ref, computed } from 'vue'
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
  min-width: 0;
  flex: 1;
  max-width: 250px;
}

.select {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.375rem 0.625rem;
  padding-right: 1.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  max-width: 200px;
  min-height: 32px;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2714%27%20height%3D%278%27%20viewBox%3D%270%200%2014%208%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M1%201l6%206%206-6%27%20stroke%3D%27%236B7280%27%20stroke-width%3D%272%27%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 12px;
}

.select:hover {
  background: #e5e7eb;
  border-color: #3b82f6;
}

.select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

@media (max-width: 768px) {
  .example-selector {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
  }
  
  .select {
    max-width: none;
    min-height: 28px;
    padding: 0.25rem 0.5rem;
    padding-right: 1.25rem;
    font-size: 0.8125rem;
    border-radius: 4px;
    background-size: 10px;
    background-position: right 0.375rem center;
  }
}
</style>