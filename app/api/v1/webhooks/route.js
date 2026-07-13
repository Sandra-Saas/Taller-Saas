import prisma from '../../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../../lib/api';
import crypto from 'crypto';

export async function GET(req) {
  try {
    // TODO: Get tenant from auth
    const tenantId = 'test-tenant-id';
    const webhooks = await prisma.webhook.findMany({
      where: { tenantId },
      include: { createdBy: true, logs: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' }
    });
    return jsonResponse(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return errorResponse('Failed to fetch webhooks');
  }
}

export async function POST(req) {
  try {
    // TODO: Get tenant and user from auth
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';
    const data = await req.json();
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
    const webhook = await prisma.webhook.create({
      data: {
        name: data.name,
        url: data.url,
        events: data.events || [],
        secret,
        tenantId,
        createdById: userId
      }
    });
    return jsonResponse(webhook, 201);
  } catch (error) {
    console.error('Error creating webhook:', error);
    return errorResponse('Failed to create webhook');
  }
}
