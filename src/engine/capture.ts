let capture: (() => string) | undefined
export function registerCapture(fn: () => string) { capture = fn; return () => { if (capture === fn) capture = undefined } }
export function captureScene() { return capture?.() }
