/**
 * WebR-specific error class
 */
export class WebRError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'WebRError'
  }
}

/**
 * Clean error messages from WebR internal prefixes
 */
export function cleanErrorMessage(error: unknown): string {
  let message = error instanceof Error ? error.message : String(error)
  
  // Remove WebR internal prefixes like "M: "
  if (message.startsWith('M: ')) {
    message = message.substring(3)
  }
  
  return message
}

/**
 * Execute an async operation with consistent error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw new WebRError(`${context}: ${cleanErrorMessage(error)}`)
  }
}

/**
 * Check if WebR is ready and throw if not
 */
export function ensureWebRReady(webR: unknown, shelter?: unknown): void {
  if (!webR) {
    throw new WebRError('WebR not initialized')
  }
  if (shelter !== undefined && !shelter) {
    throw new WebRError('WebR shelter not available')
  }
}