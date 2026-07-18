import prisma from '../../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../../lib/api';
import { generateAPIKey } from '../../../../lib/apiKeys';
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
    const apiKeys = await prisma.apiKey.findMany({
      where: { tenantId: context.tenantId },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    // Don't send full key, just last 4 chars for security
    const maskedKeys = apiKeys.map(k => ({
      ...k,
      key: `...${k.key.slice(-4)}`
    }));
    return jsonResponse(maskedKeys);
  } catch (error) {
    console.error('Error fetching api keys:', error);
    return errorResponse('Failed to fetch api keys');
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
      return errorResponse('No existe un usuario local asociado al tenant para crear API Keys.', 409);
    }

    const protection = protectInternalMutation({
      req,
      scope: 'api-keys:create',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    });

    if (!protection.ok) {
      return protection.error;
    }

    const data = await readSanitizedJson(req);
    const key = generateAPIKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        name: sanitizeString(data.name),
        key,
        scopes: data.scopes || ['*'],
        tenantId: context.tenantId,
        createdById: context.actingUserId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      }
    });

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'api_key.created',
      entity: 'APIKey',
      entityId: apiKey.id,
      newData: {
        name: apiKey.name,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return jsonResponse(apiKey, 201, protection.headers);
  } catch (error) {
    console.error('Error creating api key:', error);
    return errorResponse('Failed to create api key');
  }
}
