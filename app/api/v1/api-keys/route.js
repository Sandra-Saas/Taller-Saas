import prisma from '../../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../../lib/api';
import { generateAPIKey } from '../../../../lib/apiKeys';

export async function GET(req) {
  try {
    // TODO: Get tenant from auth
    const tenantId = 'test-tenant-id';
    const apiKeys = await prisma.apiKey.findMany({
      where: { tenantId },
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
    // TODO: Get tenant and user from auth
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';
    const data = await req.json();
    const key = generateAPIKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        name: data.name,
        key,
        scopes: data.scopes || ['*'],
        tenantId,
        createdById: userId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      }
    });
    return jsonResponse(apiKey, 201);
  } catch (error) {
    console.error('Error creating api key:', error);
    return errorResponse('Failed to create api key');
  }
}
