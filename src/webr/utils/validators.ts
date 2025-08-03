/**
 * Sanitize filename for safe file system operations
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_')
}

/**
 * Validate R variable name
 * R variable names must start with letter or dot, followed by letters, numbers, dots, or underscores
 */
export function isValidRVariableName(name: string): boolean {
  return /^[a-zA-Z.][a-zA-Z0-9._]*$/.test(name)
}

/**
 * Sanitize R variable name
 */
export function sanitizeRVariableName(name: string): string {
  // Replace invalid characters with underscore
  let sanitized = name.replace(/[^a-zA-Z0-9._]/g, '_')
  
  // Ensure it starts with a letter
  if (!/^[a-zA-Z.]/.test(sanitized)) {
    sanitized = 'var_' + sanitized
  }
  
  return sanitized
}

/**
 * Convert ImageBitmap to data URL for display
 */
export function imageToDataUrl(image: ImageBitmap): string {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas context unavailable')
  }
  
  ctx.drawImage(image, 0, 0)
  return canvas.toDataURL('image/png')
}