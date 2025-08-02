import { ref, reactive } from "vue";
import type { WebR, Shelter } from "webr";
import type { WebRMessage, CsvData } from "@/types";
import type { UseWebRReturn } from "@/types/state";
import { createExecuteCodeFunction } from "./useWebRExecution";

export const useWebR = (): UseWebRReturn => {
  const isReady = ref(false);
  const isLoading = ref(false); // For code execution
  const isInitializing = ref(false); // For WebR initialization
  const loadingStatus = ref("");
  const installedLibraries = reactive(new Set<string>());
  const messages = reactive<WebRMessage[]>([]);
  const packageVersions = reactive<Record<string, string>>({});
  const webrVersion = ref<string>("");
  const rVersion = ref<string>("");

  let webR: WebR | null = null;
  let shelter: Shelter | null = null;

  const addMessage = (type: WebRMessage["type"], content: string): void => {
    messages.push({ type, content });
  };

  const clearMessages = (): void => {
    messages.splice(0, messages.length);
  };

  const clearConsoleMessages = (): void => {
    // Remove only non-plot messages, keep charts visible during execution
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type !== "plot") {
        messages.splice(i, 1);
      }
    }
  };

  const initializeWebR = async (initialCode?: string): Promise<void> => {
    try {
      isInitializing.value = true;
      loadingStatus.value = "Initializing WebR...";

      // Import WebR from installed package
      const { WebR } = await import("webr");

      // Initialize WebR with fallback channel types
      try {
        webR = new WebR({
          interactive: false,
          channelType: 0, // 0 = SharedArrayBuffer
        });
      } catch (error) {
        console.warn(
          "SharedArrayBuffer not available, falling back to PostMessage"
        );
        webR = new WebR({
          interactive: false,
          channelType: 1, // 1 = PostMessage
        });
      }

      await webR.init();
      shelter = await new webR.Shelter();

      // Install packages one by one with status updates
      const packages = ["ggplot2", "dplyr", "ggrepel"];
      for (const pkg of packages) {
        loadingStatus.value = `Installing ${pkg}...`;
        await webR.installPackages([pkg]);
        installedLibraries.add(pkg);
      }

      isReady.value = true;
      loadingStatus.value = "WebR Ready";
      addMessage(
        "success",
        "WebR initialized successfully with ggplot2, dplyr, and ggrepel"
      );

      // Query version information
      await queryVersionInfo();

      // Auto-execute initial code if provided
      if (initialCode && initialCode.trim()) {
        await executeCode(initialCode);
      }
    } catch (error) {
      loadingStatus.value = "WebR Failed";
      addMessage("error", `Failed to initialize WebR: ${error}`);
    } finally {
      isInitializing.value = false;
    }
  };

  const executeCode = async (code: string): Promise<void> => {
    if (!webR || !shelter) {
      addMessage("error", "WebR is not ready. Please wait for initialization.");
      return;
    }

    try {
      isLoading.value = true;
      const codeExecutor = createExecuteCodeFunction(
        webR,
        shelter,
        isReady,
        addMessage
      );
      await codeExecutor(code);
    } finally {
      isLoading.value = false;
    }
  };

  const uploadCsvData = async (csvData: CsvData): Promise<void> => {
    if (!webR || !isReady.value) {
      addMessage("error", "WebR is not ready. Please wait for initialization.");
      return;
    }

    try {
      // Write the CSV content as a UTF-8 encoded file
      const fileName = csvData.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const encoder = new TextEncoder();
      const csvBytes = encoder.encode(csvData.content);
      await webR.FS.writeFile(`/tmp/${fileName}`, csvBytes);

      addMessage(
        "success",
        `CSV file '${fileName}' uploaded to /tmp/${fileName}`
      );
    } catch (error) {
      addMessage("error", `Failed to upload CSV: ${error}`);
    }
  };

  const toggleLibrary = async (library: string, install: boolean): Promise<void> => {
    if (!webR) {
      return;
    }

    try {
      if (install) {
        loadingStatus.value = `Installing ${library}...`;
        isInitializing.value = true;
        await webR.installPackages([library]);
        installedLibraries.add(library);
        addMessage("success", `${library} installed successfully`);
      } else {
        // Note: WebR doesn't support uninstalling packages
        installedLibraries.delete(library);
        addMessage("info", `${library} removed from available libraries`);
      }
    } catch (error) {
      addMessage("error", `Failed to install ${library}: ${error}`);
    } finally {
      isInitializing.value = false;
      loadingStatus.value = isReady.value ? "WebR Ready" : loadingStatus.value;
    }
  };

  const queryVersionInfo = async (): Promise<void> => {
    if (!webR || !isReady.value) {
      return;
    }

    // Query R version
    try {
      const rVersionResult = await webR.evalR("R.version.string");
      const rVersionJs = await rVersionResult.toJs();
      // Type guard to check if this is a character object with values
      if (
        rVersionJs && 
        typeof rVersionJs === 'object' && 
        'values' in rVersionJs && 
        Array.isArray(rVersionJs.values) && 
        rVersionJs.values.length > 0 &&
        typeof rVersionJs.values[0] === 'string'
      ) {
        // Remove "R version" prefix to get clean version string
        rVersion.value = rVersionJs.values[0].replace(/^R version /, "R ");
      }
    } catch (error) {
      // R version query is optional - fail silently
    }

    // Query WebR version (from package or webR object)
    try {
      // Try to get from webR object first, fallback to import meta
      webrVersion.value = "0.5.4"; // We know this from package.json
    } catch (error) {
      // WebR version query is optional - fail silently
    }

    // Query package versions
    const packages = ["ggplot2", "dplyr", "ggrepel"];

    for (const pkg of packages) {
      if (installedLibraries.has(pkg)) {
        try {
          const result = await webR.evalR(
            `as.character(packageVersion("${pkg}"))`
          );
          const jsResult = await result.toJs();

          // Type guard to check if this is a character object with values
          if (
            jsResult && 
            typeof jsResult === 'object' && 
            'values' in jsResult && 
            Array.isArray(jsResult.values) && 
            jsResult.values.length > 0 &&
            typeof jsResult.values[0] === 'string'
          ) {
            packageVersions[pkg] = jsResult.values[0];
          }
        } catch (error) {
          // Package version query is optional - fail silently
        }
      }
    }
  };

  return {
    isReady,
    isLoading,
    isInitializing,
    loadingStatus,
    installedLibraries,
    messages,
    packageVersions,
    webrVersion,
    rVersion,
    initializeWebR,
    executeCode,
    uploadCsvData,
    clearMessages,
    clearConsoleMessages,
    toggleLibrary,
  };
};
