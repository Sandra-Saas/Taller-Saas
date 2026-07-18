const globalStore = globalThis.__tallerRateLimitStore || new Map()

if (!globalThis.__tallerRateLimitStore) {
  globalThis.__tallerRateLimitStore = globalStore
}

export function checkRateLimit({ key, windowMs, max }) {
  const now = Date.now()
  const safeKey = key || 'anonymous'
  const current = globalStore.get(safeKey)

  if (!current || current.resetAt <= now) {
    const nextState = {
      count: 1,
      resetAt: now + windowMs,
    }
    globalStore.set(safeKey, nextState)

    return {
      allowed: true,
      limit: max,
      remaining: Math.max(max - 1, 0),
      resetAt: nextState.resetAt,
    }
  }

  if (current.count >= max) {
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  current.count += 1
  globalStore.set(safeKey, current)

  return {
    allowed: true,
    limit: max,
    remaining: Math.max(max - current.count, 0),
    resetAt: current.resetAt,
  }
}
