import prisma from '../../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../../lib/api';
import { generateAIResponse, buildSystemPrompt } from '../../../../lib/ai';

export async function POST(req) {
  try {
    // TODO: Get tenant from auth context
    const tenantId = 'test-tenant-id'; // Replace with real auth tenant ID

    const data = await req.json();
    const { query, messages } = data;

    // Fetch tenant data to build system prompt
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        vehicles: true,
        clients: true,
        workOrders: true,
        quotations: true,
        calendarEvents: true,
        inventoryItems: true,
      },
    });

    const systemPrompt = buildSystemPrompt(tenant);

    const response = await generateAIResponse(
      tenantId,
      [
        { role: 'system', content: systemPrompt },
        ...(messages || []),
        { role: 'user', content: query },
      ],
      'assistant'
    );

    return jsonResponse({ response });
  } catch (error) {
    console.error('Error generating AI response:', error);
    return errorResponse('Failed to generate AI response');
  }
}
