import prisma from '../../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../../lib/api';

export async function GET(req) {
  try {
    // TODO: Get tenant from auth context
    const tenantId = 'test-tenant-id';
    const rules = await prisma.automationRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return jsonResponse(rules);
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return errorResponse('Failed to fetch automation rules');
  }
}

export async function POST(req) {
  try {
    // TODO: Get tenant and user from auth
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';
    const data = await req.json();
    const rule = await prisma.automationRule.create({
      data: {
        name: data.name,
        trigger: data.trigger,
        triggerCondition: data.triggerCondition,
        actions: data.actions,
        tenantId,
        createdById: userId,
      },
    });
    return jsonResponse(rule, 201);
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return errorResponse('Failed to create automation rule');
  }
}
