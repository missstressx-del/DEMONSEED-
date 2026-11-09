/**
 * Key mapping utility functions.
 * Helper for translating keyboard event codes to reader-friendly labels.
 */

/**
 * Returns a friendly, short visual display label for a given keyboard event.code.
 * 
 * @param code - The KeyboardEvent.code (e.g. 'KeyA', 'ArrowLeft').
 * @returns A neat representation of the key.
 */
export function getKeyLabel(code: string): string {
  if (!code) return '';
  switch (code) {
    case 'ArrowLeft': return '←';
    case 'ArrowDown': return '↓';
    case 'ArrowUp': return '↑';
    case 'ArrowRight': return '→';
    case 'Space': return 'Space';
    case 'Enter': return '↵';
    case 'ShiftLeft': return 'LShift';
    case 'ShiftRight': return 'RShift';
    case 'ControlLeft': return 'LCtrl';
    case 'ControlRight': return 'RCtrl';
    case 'AltLeft': return 'LAlt';
    case 'AltRight': return 'RAlt';
    case 'CapsLock': return 'Caps';
    case 'Tab': return 'Tab';
    case 'Backspace': return 'BS';
    case 'Slash': return '/';
    case 'Period': return '.';
    case 'Comma': return ',';
    case 'Semicolon': return ';';
    case 'Quote': return "'";
    case 'BracketLeft': return '[';
    case 'BracketRight': return ']';
    case 'Backslash': return '\\';
    case 'Minus': return '-';
    case 'Equal': return '=';
    case 'Backquote': return '`';
    default:
      // Handle letter keys like "KeyA" -> "A"
      if (code.startsWith('Key')) {
        return code.slice(3).toUpperCase();
      }
      // Handle number keys like "Digit1" -> "1"
      if (code.startsWith('Digit')) {
        return code.slice(5);
      }
      // Handle numpad keys like "Numpad5" -> "N5"
      if (code.startsWith('Numpad')) {
        return 'N' + code.slice(6);
      }
      return code;
  }
}

/**
 * Presets for standard rhythm game key configurations.
 */
export const KEY_PRESETS = [
  {
    name: 'Arrow Keys',
    keys: ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight']
  },
  {
    name: 'A S D F',
    keys: ['KeyA', 'KeyS', 'KeyD', 'KeyF']
  },
  {
    name: 'D F J K',
    keys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK']
  }
];
