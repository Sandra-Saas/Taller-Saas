import { jsonResponse } from '../../../../../lib/api'
import { buildOpenApiSpec } from '../../../../../lib/public-api'

export async function GET(req) {
  const url = new URL(req.url)
  const baseUrl = `${url.protocol}//${url.host}`
  return jsonResponse(buildOpenApiSpec(baseUrl))
}
