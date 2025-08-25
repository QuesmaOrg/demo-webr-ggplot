<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
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

// Detect if we're on a mobile device
const isMobile = computed(() => {
  return window.innerWidth < 768 || 'ontouchstart' in window
})

onMounted(() => {
  if (!editorRef.value) {return}

  // Mobile-optimized settings
  const mobileConfig = {
    fontSize: 16, // Larger for mobile
    lineHeight: 22,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    scrollBeyondLastColumn: 0,
    renderLineHighlight: 'none',
    cursorBlinking: 'smooth',
    contextmenu: false, // Disable right-click menu on mobile
  }

  // Desktop settings
  const desktopConfig = {
    fontSize: 14,
    lineHeight: 20,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
    },
  }

  const baseConfig = {
    value: props.modelValue,
    language: 'r',
    theme: 'vs-light',
    minimap: { enabled: false },
    readOnly: props.readonly,
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
  }

  // Merge configs based on device type
  const config = {
    ...baseConfig,
    ...(isMobile.value ? mobileConfig : desktopConfig),
  }

  editor = monaco.editor.create(editorRef.value, config)

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
    <div
      ref="editorRef"
      class="editor-container"
    />
  </div>
</template>

<style scoped>
.code-editor {
  flex: 1;
  border: none;
  border-radius: 0;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container {
  height: 100%;
  width: 100%;
  min-height: 300px;
}

@media (max-width: 768px) {
  .code-editor {
    height: 100%;
    width: 100%;
  }
  
  .editor-container {
    min-height: 100%;
    width: 100%;
  }
}
</style>