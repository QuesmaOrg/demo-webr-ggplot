import { createApp } from 'vue'
import type { Component } from 'vue'
import App from './App.vue'
import './style.css'

// Configure Monaco to not use workers - set up global for Monaco editor
interface MonacoEnvironment {
  getWorker: () => Worker
}

declare global {
  interface Window {
    MonacoEnvironment: MonacoEnvironment
  }
}

window.MonacoEnvironment = {
  getWorker: (): Worker => {
    // Return a mock Worker since we're disabling web workers for Monaco
    return {
      postMessage: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      terminate: () => {},
      onerror: null,
      onmessage: null,
      onmessageerror: null,
    } as unknown as Worker
  }
}

// Suppress WebR Content-Encoding errors
const originalError = console.error
console.error = (...args: unknown[]): void => {
  const message = args.join(' ')
  if (message.includes('Content-Encoding') || message.includes('unsafe header')) {
    return // Suppress these specific errors
  }
  originalError.apply(console, args)
}

createApp(App as Component).mount('#app')