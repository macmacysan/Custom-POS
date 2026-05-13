/** Cross-component keyboard UI triggers (listeners live in TopNav). */

export const APP_HOTKEY_OPEN_SHORTCUT_GUIDE = 'pos-app:open-shortcut-guide'
export const APP_HOTKEY_OPEN_SETTINGS = 'pos-app:open-settings'

export function dispatchOpenShortcutGuide() {
  window.dispatchEvent(new CustomEvent(APP_HOTKEY_OPEN_SHORTCUT_GUIDE))
}

export function dispatchOpenSettings() {
  window.dispatchEvent(new CustomEvent(APP_HOTKEY_OPEN_SETTINGS))
}
