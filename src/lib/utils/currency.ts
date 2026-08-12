/** Convert a decimal string or number input to centavos integer. "1250.75" → 125075 */
export function toCentavos(value: string | number): number {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

/** Convert centavos integer to peso decimal. 125075 → 1250.75 */
export function fromCentavos(centavos: number): number {
  return centavos / 100
}

/** Format centavos as ₱1,250.75 */
export function formatPHP(centavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromCentavos(centavos))
}

/** Format centavos as a plain number string with 2 decimal places. 125075 → "1,250.75" */
export function formatAmount(centavos: number): string {
  return fromCentavos(centavos).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Parse a user-typed amount string into centavos. Returns null if invalid. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) return null
  if (parts[1] && parts[1].length > 2) return null
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 0) return null
  return Math.round(num * 100)
}
