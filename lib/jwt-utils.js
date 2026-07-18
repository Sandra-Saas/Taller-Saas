import { randomBytes, createHmac } from 'crypto'

// Crear un JWT simple sin dependencias externas
export function createJWT(payload, secret = process.env.JWT_SECRET || 'super-admin-secret') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  
  const hmac = createHmac('sha256', secret)
  hmac.update(`${header}.${body}`)
  const signature = hmac.digest('base64url')
  
  return `${header}.${body}.${signature}`
}

export function verifyJWT(token, secret = process.env.JWT_SECRET || 'super-admin-secret') {
  try {
    const [header, body, signature] = token.split('.')
    if (!header || !body || !signature) {
      return null
    }

    // Verificar firma
    const hmac = createHmac('sha256', secret)
    hmac.update(`${header}.${body}`)
    const expectedSignature = hmac.digest('base64url')
    
    if (signature !== expectedSignature) {
      return null
    }

    // Decodificar payload
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    
    // Verificar expiración si existe
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
