function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function sanitizeString(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry))
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeValue(entry)])
    )
  }

  if (typeof value === 'string') {
    return sanitizeString(value)
  }

  return value
}

export async function readSanitizedJson(req) {
  const payload = await req.json()
  return sanitizeValue(payload)
}

export function toSafeNumber(value, fallback = 0) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

export function toSafeInteger(value, fallback = 0) {
  return Math.trunc(toSafeNumber(value, fallback))
}
