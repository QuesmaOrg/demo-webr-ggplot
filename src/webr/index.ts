/**
 * WebR Pure Module Exports
 * 
 * This module provides pure JavaScript/TypeScript functionality for WebR,
 * with no Vue dependencies. It can be used in any JavaScript environment.
 * 
 * ## Architecture
 * 
 * **Core Layer**: WebR instance management and type definitions
 * - `WebRInstance`: Manages WebR lifecycle (init/destroy)
 * - `types`: TypeScript definitions for WebR objects and results
 * 
 * **Runtime Layer**: Code execution and output processing  
 * - `Executor`: Executes R code and captures all output streams
 * - `Serializer`: Converts R objects to string representations
 * - `OutputProcessor`: Processes WebR capture results into display format
 * 
 * **Storage Layer**: File and package management
 * - `PackageManager`: Installs and tracks R packages
 * - `FileSystem`: Manages file uploads to WebR virtual filesystem
 * 
 * **Utils**: Helper functions for type conversion and error handling
 * - `r-converters`: Convert R objects to JavaScript types
 * - `errors`: Error handling utilities
 * - `validators`: Input validation and sanitization
 * 
 * ## Usage
 * 
 * For Vue applications, use the `useWebR()` composable from `@/composables/useWebR`.
 * For other frameworks, import the pure modules directly from this index.
 * 
 * @see https://docs.r-wasm.org/webr/latest/ - Official WebR documentation
 */

// Core
export { WebRInstance } from './core/webr-instance'
export * from './core/types'

// Runtime
export { Executor } from './runtime/executor'
export { Serializer } from './runtime/serializer'
export { OutputProcessor } from './runtime/output-processor'

// Storage
export { PackageManager } from './storage/package-manager'
export { FileSystem } from './storage/file-system'

// Utilities
export * from './utils/r-converters'
export * from './utils/errors'
export * from './utils/validators'