<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as monaco from 'monaco-editor'

interface Props {
  modelValue: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorRef.value) return

  editor = monaco.editor.create(editorRef.value, {
    value: props.modelValue,
    language: 'r',
    theme: 'vs-light',
    minimap: { enabled: false },
    readOnly: props.readonly,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    // Disable features that require workers
    links: false,
    colorDecorators: false,
    codeLens: false,
    folding: false,
    foldingStrategy: 'indentation',
    showFoldingControls: 'never',
    matchBrackets: 'never',
    glyphMargin: false,
    // Disable language features that need workers
    suggest: { showWords: false },
    quickSuggestions: false,
    parameterHints: { enabled: false },
    hover: { enabled: false },
  })

  editor.onDidChangeModelContent(() => {
    if (editor) {
      emit('update:modelValue', editor.getValue())
    }
  })
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && editor.getValue() !== newValue) {
      editor.setValue(newValue)
    }
  }
)

onUnmounted(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>

<template>
  <div class="code-editor">
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<style scoped>
.code-editor {
  height: 400px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.editor-container {
  height: 100%;
  width: 100%;
}
</style>