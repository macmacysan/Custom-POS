/** Human-readable shortcut fragments for tooltips (OS-aware). */

export function isAppleOS(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
  if (uaData) return uaData === 'macOS' || uaData === 'iOS'
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) || /Mac OS/.test(ua)
}

export function modLabel(): string {
  return isAppleOS() ? '⌘' : 'Ctrl'
}

export function altLabel(): string {
  return isAppleOS() ? '⌥' : 'Alt'
}

export const kb = {
  mod: modLabel,
  alt: altLabel,
  save: () => `${modLabel()}+S`,
  saveAlso: () => `${modLabel()}+Enter`,
  undo: () => `${modLabel()}+Z`,
  redo: () => `${modLabel()}+Shift+Z / ${modLabel()}+Y`,
  cancel: () => 'Esc',
  deleteRow: () => `${modLabel()}+Backspace / ${modLabel()}+Del`,
  newField: () => `${altLabel()}+N`,
  prevDay: () => `${altLabel()}+←`,
  nextDay: () => `${altLabel()}+→`,
  today: () => `${altLabel()}+T`,
  theme: () => `${altLabel()}+D`,
  sidebar: () => `${altLabel()}+B`,
  settings: () => `${altLabel()}+S`,
  shortcuts: () => '? (Shift+/)',
  workspaceTab: (n: number) => `${altLabel()}+${n}`,
}

/** True when the browser should keep native typing shortcuts (e.g. Ctrl+Z for text). */
export function isTextEntryElement(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  if (el.tagName === 'TEXTAREA') return true
  if (el.tagName !== 'INPUT') return false
  const t = (el as HTMLInputElement).type
  return ['text', 'search', 'email', 'url', 'tel', 'password', 'number'].includes(t) || t === ''
}
