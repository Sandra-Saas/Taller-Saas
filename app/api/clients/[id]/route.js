import prisma from '../../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../../lib/api';

// Get single client
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const tenantId = 'test-tenant-id';
    const client = await prisma.client.findUnique({
      where: { id, tenantId },
      include: {
        phones: true,
        emails: true,
        addresses: true,
        company: true,
        tags: { include: { tag: true } },
        vehicles: true,
        workOrders: true,
      },
    });
    if (!client) {
      return errorResponse('Client not found', 404);
    }
    return jsonResponse(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return errorResponse('Failed to fetch client');
  }
}

// Update client
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const data = await req.json();
    const tenantId = 'test-tenant-id';
    
    const client = await prisma.client.update({
      where: { id, tenantId },
      data,
      include: {
        phones: true,
        emails: true,
        addresses: true,
        company: true,
        tags: { include: { tag: true } },
      },
    });
    return jsonResponse(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return errorResponse('Failed to update client');
  }
}

// Delete client
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const tenantId = 'test-tenant-id';
    
    await prisma.client.delete({
      where: { id, tenantId },
    });
    return jsonResponse({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return errorResponse('Failed to delete client');
  }
}
