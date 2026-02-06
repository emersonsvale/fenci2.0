/**
 * Formatação de datas no padrão brasileiro DD/MM/YYYY.
 * Internamente a API usa YYYY-MM-DD (ISO date).
 */

/**
 * Converte data (YYYY-MM-DD ou Date) para string DD/MM/YYYY.
 */
export function toDDMMYYYY(isoOrDate: string | Date): string {
  if (isoOrDate instanceof Date) {
    const d = isoOrDate.getDate()
    const m = isoOrDate.getMonth() + 1
    const y = isoOrDate.getFullYear()
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
  }
  const s = String(isoOrDate).split('T')[0]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return ''
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Converte string DD/MM/YYYY para YYYY-MM-DD (para armazenamento/API).
 * Retorna '' se inválida.
 */
export function fromDDMMYYYY(ddmmyyyy: string): string {
  const cleaned = ddmmyyyy.replace(/\D/g, '')
  if (cleaned.length !== 8) return ''
  const d = parseInt(cleaned.slice(0, 2), 10)
  const m = parseInt(cleaned.slice(2, 4), 10)
  const y = parseInt(cleaned.slice(4, 8), 10)
  if (m < 1 || m > 12 || d < 1 || d > 31) return ''
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return ''
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Formata data para exibição curta: DD/MM/YYYY.
 */
export function formatDateDisplay(isoOrDate: string | Date): string {
  return toDDMMYYYY(isoOrDate)
}
