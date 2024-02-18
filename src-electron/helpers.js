/**
 * Merge new header with existing headers, handling lowercase header duplicates
 *
 * @param {Object} headers Existing headers
 * @param {string} key New Header Key, in normal ccase
 * @param {string} value New Header Value
 */
export function mergeWithHeaders (headers = {}, key, value) {
  const lowerKey = key.toLowerCase()
  if (lowerKey in headers) {
    headers[lowerKey] = value
  } else {
    headers[key] = value
  }
}
