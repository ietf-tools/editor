// Adapted from tinykeys by Jamie Kyle
// https://github.com/jamiebuilds/tinykeys

import { platform } from 'node:process'

/**
* These are the modifier keys that change the meaning of keybindings.
*
* Note: Ignoring "AltGraph" because it is covered by the others.
*/
const KEYBINDING_MODIFIER_KEYS = ['Shift', 'Meta', 'Alt', 'Control']
const KEYBINDING_MODIFIER_KEYS_LC = KEYBINDING_MODIFIER_KEYS.map(k => k.toLowerCase())

/**
* Keybinding sequences should timeout if individual key presses are more than
* 1s apart by default.
*/
const DEFAULT_TIMEOUT = 1000

/**
* An alias for creating platform-specific keybinding aliases.
*/
const MOD = platform === 'darwin' ? 'meta' : 'control'

/**
* Parses a "Key Binding String" into its parts
*
* grammar    = `<sequence>`
* <sequence> = `<press> <press> <press> ...`
* <press>    = `<key>` or `<mods>+<key>`
* <mods>     = `<mod>+<mod>+...`
* <key>      = `<KeyboardEvent.key>` or `<KeyboardEvent.code>` (case-insensitive)
* <key>      = `(<regex>)` -> `/^<regex>$/` (case-sensitive)
*/
export function parseKeybinding (str) {
  return str
    .trim()
    .split(' ')
    .map(press => {
      let mods = press.split(/\b\+/)
      let key = mods.pop()
      const match = key.match(/^\((.+)\)$/)
      if (match) {
        key = new RegExp(`^${match[1]}$`)
      }
      mods = mods.map(mod => (mod === '$mod' ? MOD : mod.toLowerCase()))
      return [mods, key]
    })
}

/**
* This tells us if a single keyboard event matches a single keybinding press.
*/
export function matchKeyBindingPress (
  input,
  [mods, key]
) {
  return !(
    // Allow either the `input.key` or the `input.code`
    // MDN event.key: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
    // MDN event.code: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
    (
      key instanceof RegExp
        ? !key.test(input.key)
        : (key.toUpperCase() !== input.key.toUpperCase() && key !== input.code)
    ) ||

    // Ensure all the modifiers in the keybinding are pressed.
    mods.find(mod => {
      return !input.modifiers.includes(mod)
    }) ||

    // KEYBINDING_MODIFIER_KEYS (Shift/Control/etc) change the meaning of a
    // keybinding. So if they are pressed but aren't part of the current
    // keybinding press, then we don't have a match.
    KEYBINDING_MODIFIER_KEYS_LC.find(mod => {
      return !mods.includes(mod) && key !== mod && input.modifiers.includes(mod)
    })
  )
}

/**
* Creates an event listener for handling keybindings.
*/
export function createKeybindingsHandler (
  keyBindingMap,
  options = {}
) {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT

  const keyBindings = Object.keys(keyBindingMap).map(key => {
    return [parseKeybinding(key), keyBindingMap[key]]
  })

  const possibleMatches = new Map()
  let timer = null

  return (event, input) => {
    keyBindings.forEach(keyBinding => {
      const sequence = keyBinding[0]
      const callback = keyBinding[1]

      const prev = possibleMatches.get(sequence)
      const remainingExpectedPresses = prev || sequence
      const currentExpectedPress = remainingExpectedPresses[0]

      const matches = matchKeyBindingPress(input, currentExpectedPress)

      if (!matches) {
        // Modifier keydown events shouldn't break sequences
        if (!(KEYBINDING_MODIFIER_KEYS.includes(input.key) || input.key === 'AltGraph')) {
          possibleMatches.delete(sequence)
        }
      } else if (remainingExpectedPresses.length > 1) {
        possibleMatches.set(sequence, remainingExpectedPresses.slice(1))
      } else {
        possibleMatches.delete(sequence)
        callback(event, input)
      }
    })

    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(possibleMatches.clear.bind(possibleMatches), timeout)
  }
}
