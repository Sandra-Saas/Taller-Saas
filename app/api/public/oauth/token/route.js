import { jsonResponse } from '../../../../../lib/api'

export async function POST() {
  return jsonResponse(
    {
      status: 'not_implemented',
      message: 'OAuth 2.0 quedó preparado a nivel de contrato, pero el exchange de tokens aún no fue habilitado en esta etapa.',
    },
    501
  )
}
