import type { WebR } from 'webr'
import type { PackageInfo } from '../core/types'
import { extractFirstString } from '../utils/r-converters'
import { withErrorHandling } from '../utils/errors'

/**
 * Manages R package installation and tracking
 * @see https://docs.r-wasm.org/webr/latest/packages.html
 */
export class PackageManager {
  private installed = new Set<string>()
  private versions = new Map<string, string>()
  
  // Essential packages for ggplot2 demos
  static readonly ESSENTIALS = ['ggplot2', 'dplyr', 'ggrepel'] as const

  constructor(private webR: WebR) {}

  /**
   * Install an R package from the WebR repository
   * @see https://docs.r-wasm.org/webr/latest/packages.html#installing-packages-from-the-default-webr-binary-repo
   */
  async install(packageName: string): Promise<PackageInfo> {
    if (this.installed.has(packageName)) {
      return {
        name: packageName,
        version: this.versions.get(packageName) || 'unknown'
      }
    }

    return withErrorHandling(async () => {
      // Install package using WebR's installPackages method
      await this.webR.installPackages([packageName])
      
      // Mark as installed
      this.installed.add(packageName)
      
      // Get and store version
      const version = await this.getVersion(packageName)
      if (version) {
        this.versions.set(packageName, version)
      }
      
      return {
        name: packageName,
        version: version || 'unknown'
      }
    }, `Failed to install package ${packageName}`)
  }

  /**
   * Install multiple packages
   */
  async installMultiple(packageNames: string[]): Promise<PackageInfo[]> {
    const results: PackageInfo[] = []
    
    for (const name of packageNames) {
      try {
        const info = await this.install(name)
        results.push(info)
      } catch {
        // Continue with other packages if one fails
        results.push({ name, version: 'failed' })
      }
    }
    
    return results
  }

  /**
   * Install essential packages for ggplot2 demos
   */
  async installEssentials(): Promise<PackageInfo[]> {
    return this.installMultiple([...PackageManager.ESSENTIALS])
  }

  /**
   * Get the version of an installed package
   * @see https://docs.r-wasm.org/webr/latest/api/r.html
   */
  async getVersion(packageName: string): Promise<string | null> {
    try {
      const result = await this.webR.evalR(`as.character(packageVersion("${packageName}"))`)
      return await extractFirstString(result)
    } catch {
      return null
    }
  }

  /**
   * Check if a package is installed
   */
  async isInstalled(packageName: string): Promise<boolean> {
    // First check our cache
    if (this.installed.has(packageName)) {
      return true
    }

    // Then check in R
    try {
      const result = await this.webR.evalR(`requireNamespace("${packageName}", quietly = TRUE)`)
      const js = await result.toJs()
      const isInstalled = js?.values?.[0] === true
      
      // Update cache if installed
      if (isInstalled) {
        this.installed.add(packageName)
      }
      
      return isInstalled
    } catch {
      return false
    }
  }

  /**
   * List all available packages in the WebR repository
   * @see https://docs.r-wasm.org/webr/latest/packages.html#available-packages
   */
  async listAvailable(): Promise<string[]> {
    try {
      const result = await this.webR.evalR('available.packages()[, "Package"]')
      const js = await result.toJs()
      
      if (js?.values && Array.isArray(js.values)) {
        return js.values as string[]
      }
      
      return []
    } catch {
      return []
    }
  }

  /**
   * Get information about all tracked packages
   */
  getTrackedPackages(): PackageInfo[] {
    return Array.from(this.installed).map(name => ({
      name,
      version: this.versions.get(name) || 'unknown'
    }))
  }

  /**
   * Remove a package from tracking (doesn't uninstall from R)
   */
  removeFromTracking(packageName: string): void {
    this.installed.delete(packageName)
    this.versions.delete(packageName)
  }

  /**
   * Clear all tracking data
   */
  clearTracking(): void {
    this.installed.clear()
    this.versions.clear()
  }
}