import { jsonResponse } from '../../../../../lib/api'

export async function GET() {
  return jsonResponse(
    {
      status: 'not_implemented',
      message: 'OAuth 2.0 quedó preparado a nivel de contrato, pero la autorización aún no fue habilitada en esta etapa.',
    },
    501
  )
}
