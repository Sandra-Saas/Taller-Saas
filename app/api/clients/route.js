import prisma from '../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../lib/api';

// Get all clients
export async function GET(req) {
  try {
    const tenantId = 'test-tenant-id'; // TODO: Replace with real tenant from auth
    const clients = await prisma.client.findMany({
      where: { tenantId },
      include: {
        phones: true,
        emails: true,
        addresses: true,
        company: true,
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return jsonResponse(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return errorResponse('Failed to fetch clients');
  }
}

// Create a client
export async function POST(req) {
  try {
    const data = await req.json();
    const tenantId = 'test-tenant-id'; // TODO: Replace with real tenant from auth
    
    // Get next number (we'll implement proper numbering later)
    const lastClient = await prisma.client.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const client = await prisma.client.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        phones: true,
        emails: true,
        addresses: true,
        company: true,
        tags: { include: { tag: true } },
      },
    });
    
    return jsonResponse(client, 201);
  } catch (error) {
    console.error('Error creating client:', error);
    return errorResponse('Failed to create client');
  }
}
