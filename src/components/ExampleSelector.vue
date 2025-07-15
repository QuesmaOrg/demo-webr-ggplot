<script setup lang="ts">
import { ref, computed } from 'vue'
import { examples } from '@/data/examples'
import type { RExample } from '@/types'

const emit = defineEmits<{
  exampleSelected: [example: RExample]
}>()

const selectedExample = ref<string>('')

const currentExample = computed(() => {
  return examples.find((ex) => ex.id === selectedExample.value) || null
})

const handleExampleChange = () => {
  if (currentExample.value) {
    emit('exampleSelected', currentExample.value)
  }
}
</script>

<template>
  <div class="example-selector">
    <label for="example-select" class="label">Examples:</label>
    <select
      id="example-select"
      v-model="selectedExample"
      @change="handleExampleChange"
      class="select"
    >
      <option value="">Select an example...</option>
      <option v-for="example in examples" :key="example.id" :value="example.id">
        {{ example.title }}
      </option>
    </select>
    <div v-if="currentExample" class="example-info">
      <p class="description">{{ currentExample.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.example-selector {
  margin-bottom: 1rem;
}

.label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.example-info {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 4px;
  border-left: 4px solid #3b82f6;
}

.description {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>