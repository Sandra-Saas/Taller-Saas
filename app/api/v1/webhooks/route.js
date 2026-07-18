import prisma from '../../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../../lib/api';
import crypto from 'crypto';
import { createAuditLog } from '../../../../lib/audit';
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security';
import { requireTenantContext } from '../../../../lib/request-context';
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false });
    if (!tenantResult.ok) {
      return tenantResult.error;
    }

    const { context } = tenantResult;
    const webhooks = await prisma.webhook.findMany({
      where: { tenantId: context.tenantId },
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
    const tenantResult = await requireTenantContext(req, { allowApiKey: false });
    if (!tenantResult.ok) {
      return tenantResult.error;
    }

    const { context } = tenantResult;
    if (!context.actingUserId) {
      return errorResponse('No existe un usuario local asociado al tenant para crear Webhooks.', 409);
    }

    const protection = protectInternalMutation({
      req,
      scope: 'webhooks:create',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    });

    if (!protection.ok) {
      return protection.error;
    }

    const data = await readSanitizedJson(req);
    if (!String(data.url || '').startsWith('https://')) {
      return errorResponse('La URL del webhook debe usar HTTPS.', 400);
    }

    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
    const webhook = await prisma.webhook.create({
      data: {
        name: sanitizeString(data.name),
        url: sanitizeString(data.url),
        events: data.events || [],
        secret,
        tenantId: context.tenantId,
        createdById: context.actingUserId
      }
    });

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'webhook.created',
      entity: 'Webhook',
      entityId: webhook.id,
      newData: {
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return jsonResponse(webhook, 201, protection.headers);
  } catch (error) {
    console.error('Error creating webhook:', error);
    return errorResponse('Failed to create webhook');
  }
}
