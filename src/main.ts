import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Configure Monaco to not use workers
;(window as any).MonacoEnvironment = {
  getWorker: () => {
    return {
      postMessage: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      terminate: () => {},
      onerror: null,
      onmessage: null,
      onmessageerror: null,
    }
  }
}

// Suppress WebR Content-Encoding errors
const originalError = console.error
console.error = (...args) => {
  const message = args.join(' ')
  if (message.includes('Content-Encoding') || message.includes('unsafe header')) {
    return // Suppress these specific errors
  }
  originalError.apply(console, args)
}

createApp(App).mount('#app')