import { ref } from 'vue'

export interface ErrorInfo {
  message: string
  code?: string
  stack?: string
  timestamp: Date
}

export const useErrorHandling = (): {
  errors: import('vue').Ref<ErrorInfo[]>
  lastError: import('vue').Ref<ErrorInfo | null>
  logError: (error: Error | string, code?: string) => void
  clearErrors: () => void
  clearLastError: () => void
  withErrorHandling: <T>(operation: () => Promise<T>, errorCode?: string) => Promise<T | null>
} => {
  const errors = ref<ErrorInfo[]>([])
  const lastError = ref<ErrorInfo | null>(null)

  const logError = (error: Error | string, code?: string): void => {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      code,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: new Date()
    }

    errors.value.push(errorInfo)
    lastError.value = errorInfo

    // Errors are stored in the errors array for UI display
  }

  const clearErrors = (): void => {
    errors.value = []
    lastError.value = null
  }

  const clearLastError = (): void => {
    lastError.value = null
  }

  // Wrapper for async operations with error handling
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    errorCode?: string
  ): Promise<T | null> => {
    try {
      return await operation()
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), errorCode)
      return null
    }
  }

  return {
    errors,
    lastError,
    logError,
    clearErrors,
    clearLastError,
    withErrorHandling,
  }
}