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

/**
 * Get the file path for the extra _draftforge.json file based on a document file path
 *
 * @param {string} filePath Document file path
 */
export function getExtraFilePath (filePath) {
  return filePath.substring(0, filePath.lastIndexOf('.')) + '_draftforge.json'
}
