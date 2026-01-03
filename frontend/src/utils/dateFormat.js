/**
 * Date formatting utility that uses system settings
 */

/**
 * Format a date string according to the specified format
 * @param {string} dateString - Date string in ISO format (YYYY-MM-DD)
 * @param {string} format - Format pattern (e.g., 'yyyy/MM/dd', 'MM/dd/yyyy', 'dd/MM/yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, format = 'yyyy/MM/dd') => {
  if (!dateString) return '-'

  // Handle both ISO date strings and Date objects
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  if (isNaN(date.getTime())) return dateString

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  // Replace format patterns
  return format
    .replace('yyyy', year)
    .replace('MM', month)
    .replace('dd', day)
}

/**
 * Format a date string to short format (without year)
 * @param {string} dateString - Date string in ISO format (YYYY-MM-DD)
 * @param {string} format - Format pattern
 * @returns {string} Formatted date string (MM/dd portion only)
 */
export const formatDateShort = (dateString, format = 'yyyy/MM/dd') => {
  if (!dateString) return '-'

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  if (isNaN(date.getTime())) return dateString

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  // Determine separator from format
  const separator = format.includes('/') ? '/' : format.includes('-') ? '-' : '/'

  // Determine order from format
  if (format.toLowerCase().startsWith('dd')) {
    return `${day}${separator}${month}`
  } else {
    return `${month}${separator}${day}`
  }
}

export default formatDate
