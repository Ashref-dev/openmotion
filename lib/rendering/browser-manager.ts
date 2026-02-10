import { openBrowser } from "@remotion/renderer";

export async function ensureBrowserReady() {
  return await openBrowser("chrome");
}

export async function closeBrowser(browser: Awaited<ReturnType<typeof openBrowser>>) {
  if (browser && typeof browser === 'object' && 'close' in browser && typeof browser.close === 'function') {
    await (browser.close as () => Promise<void>)();
  }
}
