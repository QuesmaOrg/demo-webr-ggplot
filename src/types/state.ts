import type { Ref } from 'vue'
import type { WebRMessage, CsvData } from './index'

export interface WebRState {
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
  isInitializing: Ref<boolean>
  loadingStatus: Ref<string>
  webrVersion: Ref<string>
  rVersion: Ref<string>
  installedLibraries: Set<string>
  packageVersions: Record<string, string>
  messages: WebRMessage[]
}

export interface WebRActions {
  initializeWebR: (initialCode?: string) => Promise<void>
  executeCode: (code: string) => Promise<void>
  uploadCsvData: (csvData: CsvData) => Promise<void>
  toggleLibrary: (library: string, install: boolean) => Promise<void>
  clearMessages: () => void
  clearConsoleMessages: () => void
}

export interface UseWebRReturn extends WebRState, WebRActions {}