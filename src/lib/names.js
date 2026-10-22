/** Shared team-name key so sheet cells, Contact Info, and results line up. */
export function normalizeTeamKey(name) {
  return String(name || '')
    .replace(/\u00a0/g, ' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function cleanCellText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]*\n[ \t]*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
