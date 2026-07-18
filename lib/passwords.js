import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY_LENGTH = 64

export function hashPassword(password) {
  const normalizedPassword = String(password || '')
  if (!normalizedPassword.trim()) {
    throw new Error('La contraseña no puede estar vacía.')
  }

  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(normalizedPassword, salt, KEY_LENGTH).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password, storedValue) {
  const normalizedPassword = String(password || '')
  const stored = String(storedValue || '')

  if (!stored.startsWith('scrypt:')) {
    return false
  }

  const [, salt, hash] = stored.split(':')
  if (!salt || !hash) {
    return false
  }

  const derived = scryptSync(normalizedPassword, salt, KEY_LENGTH)
  const original = Buffer.from(hash, 'hex')

  if (derived.length !== original.length) {
    return false
  }

  return timingSafeEqual(derived, original)
}
