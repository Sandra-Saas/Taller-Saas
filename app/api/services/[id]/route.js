import prisma from '../../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../../lib/api';

// Get single service
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const tenantId = 'test-tenant-id';
    const service = await prisma.service.findUnique({
      where: { id, tenantId },
    });
    if (!service) {
      return errorResponse('Service not found', 404);
    }
    return jsonResponse(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return errorResponse('Failed to fetch service');
  }
}

// Update service
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const data = await req.json();
    const tenantId = 'test-tenant-id';

    const service = await prisma.service.update({
      where: { id, tenantId },
      data,
    });
    return jsonResponse(service);
  } catch (error) {
    console.error('Error updating service:', error);
    return errorResponse('Failed to update service');
  }
}

// Delete service
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const tenantId = 'test-tenant-id';

    await prisma.service.delete({
      where: { id, tenantId },
    });
    return jsonResponse({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return errorResponse('Failed to delete service');
  }
}
