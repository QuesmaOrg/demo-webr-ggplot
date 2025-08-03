import { ref, reactive, computed, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { WebRMessage, CsvData } from '@/types'
import { 
  WebRInstance, 
  Executor, 
  PackageManager, 
  FileSystem,
  cleanErrorMessage 
} from '@/webr'

interface UseWebRReturn {
  // State
  messages: Readonly<WebRMessage[]>
  isReady: Readonly<Ref<boolean>>
  isLoading: Readonly<Ref<boolean>>
  isInitializing: Readonly<Ref<boolean>>
  loadingStatus: Readonly<Ref<string>>
  webrVersion: ComputedRef<string>
  rVersion: ComputedRef<string>
  installedLibraries: Readonly<Set<string>>
  packageVersions: Readonly<Record<string, string>>
  
  // Actions
  initializeWebR: (initialCode?: string) => Promise<void>
  executeCode: (code: string) => Promise<void>
  uploadCsvData: (csvData: CsvData) => Promise<void>
  toggleLibrary: (library: string, install: boolean) => Promise<void>
  clearMessages: () => void
  clearConsoleMessages: () => void
  destroy: () => Promise<void>
}

/**
 * Vue composable that wraps pure WebR modules with reactive state
 */
export function useWebR(): UseWebRReturn {
  // Vue reactive state
  const messages = reactive<WebRMessage[]>([])
  const isReady = ref(false)
  const isInitializing = ref(false)
  const isExecuting = ref(false)
  const isInstallingPackage = ref(false)
  const isUploadingFile = ref(false)
  const status = ref('')
  const versions = ref({ r: '', webr: '' })
  const installedPackages = reactive(new Set<string>())
  const packageVersions = reactive<Record<string, string>>({})
  const uploadedFiles = reactive<string[]>([])
  const lastExecutionDuration = ref(0)

  // Pure WebR instances (not reactive)
  let instance: WebRInstance | null = null
  let executor: Executor | null = null
  let packages: PackageManager | null = null
  let fileSystem: FileSystem | null = null

  // Helper to add messages
  const addMessage = (type: WebRMessage['type'], content: string): void => {
    messages.push({ type, content })
  }

  // Initialize WebR
  const initializeWebR = async (initialCode?: string): Promise<void> => {
    if (instance?.isReady) return

    try {
      isInitializing.value = true
      status.value = 'Loading WebR...'

      // Create and initialize WebR instance
      instance = new WebRInstance()
      status.value = 'Initializing WebR...'
      
      const versionInfo = await instance.initialize()
      versions.value = versionInfo

      // Create specialized modules
      const webR = instance.getWebR()
      const shelter = instance.getShelter()
      
      executor = new Executor(webR, shelter)
      packages = new PackageManager(webR)
      fileSystem = new FileSystem(webR)

      // Install essential packages
      status.value = 'Installing packages...'
      const essentialPackages = await packages.installEssentials()
      
      // Update reactive state
      essentialPackages.forEach(pkg => {
        installedPackages.add(pkg.name)
        if (pkg.version !== 'failed') {
          packageVersions[pkg.name] = pkg.version
        }
      })

      const essentialList = PackageManager.ESSENTIALS.join(', ')
      addMessage('success', `WebR initialized with ${essentialList}`)
      
      isReady.value = true
      status.value = 'Ready'

      // Execute initial code if provided
      if (initialCode?.trim()) {
        await executeCode(initialCode)
      }

    } catch (error) {
      status.value = 'Failed'
      addMessage('error', `Initialization failed: ${cleanErrorMessage(error)}`)
      throw error
    } finally {
      isInitializing.value = false
    }
  }

  // Execute R code
  const executeCode = async (code: string): Promise<void> => {
    if (!executor) {
      addMessage('error', 'WebR not ready')
      return
    }

    try {
      isExecuting.value = true
      
      const result = await executor.execute(code)
      lastExecutionDuration.value = result.duration

      // Add output messages
      result.outputs.forEach(output => {
        messages.push({ type: output.type, content: output.content })
      })

      // Add plot messages
      result.plots.forEach(dataUrl => {
        messages.push({ type: 'plot', content: dataUrl })
      })

    } finally {
      isExecuting.value = false
    }
  }

  // Upload CSV data
  const uploadCsvData = async (csvData: CsvData): Promise<void> => {
    if (!fileSystem) {
      addMessage('error', 'WebR not ready')
      return
    }

    try {
      isUploadingFile.value = true
      
      const { file, message } = await fileSystem.uploadAndLoad(
        csvData.content,
        csvData.name,
        'data'
      )
      
      uploadedFiles.push(file.name)
      addMessage('success', `${csvData.name}: ${message}`)
      
    } catch (error) {
      addMessage('error', cleanErrorMessage(error))
    } finally {
      isUploadingFile.value = false
    }
  }

  // Toggle library installation
  const toggleLibrary = async (library: string, install: boolean): Promise<void> => {
    if (!packages) {
      addMessage('error', 'WebR not ready')
      return
    }

    try {
      if (install) {
        isInstallingPackage.value = true
        const info = await packages.install(library)
        
        if (info.version !== 'failed') {
          installedPackages.add(info.name)
          packageVersions[info.name] = info.version
          addMessage('success', `${library} (${info.version}) installed`)
        } else {
          addMessage('error', `Failed to install ${library}`)
        }
      } else {
        packages.removeFromTracking(library)
        installedPackages.delete(library)
        delete packageVersions[library]
        addMessage('info', `${library} removed from tracking`)
      }
    } catch (error) {
      addMessage('error', cleanErrorMessage(error))
    } finally {
      isInstallingPackage.value = false
    }
  }

  // Clear messages
  const clearMessages = (): void => {
    messages.splice(0, messages.length)
  }

  // Clear console messages (keep plots)
  const clearConsoleMessages = (): void => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type !== 'plot') {
        messages.splice(i, 1)
      }
    }
  }

  // Destroy WebR instance
  const destroy = async (): Promise<void> => {
    if (instance) {
      await instance.destroy()
      instance = null
      executor = null
      packages = null
      fileSystem = null
      isReady.value = false
      status.value = 'Destroyed'
    }
  }

  // Computed loading state
  const isLoading = computed(() => 
    isInitializing.value || 
    isExecuting.value || 
    isInstallingPackage.value || 
    isUploadingFile.value
  )

  // Return public API with readonly state where appropriate
  return {
    // State (readonly)
    messages: readonly(messages),
    isReady: readonly(isReady),
    isLoading: readonly(isLoading),
    isInitializing: readonly(isInitializing),
    loadingStatus: readonly(status),
    webrVersion: computed(() => versions.value.webr),
    rVersion: computed(() => versions.value.r),
    installedLibraries: readonly(installedPackages),
    packageVersions: readonly(packageVersions),
    
    // Actions
    initializeWebR,
    executeCode,
    uploadCsvData,
    toggleLibrary,
    clearMessages,
    clearConsoleMessages,
    destroy,
  }
}