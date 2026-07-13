import prisma from '../../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../../lib/api';

// Get single vehicle
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const tenantId = 'test-tenant-id';
    const vehicle = await prisma.vehicle.findUnique({
      where: { id, tenantId },
      include: {
        client: true,
        documents: true,
        receptions: true,
        workOrders: true,
        statusLogs: true,
      },
    });
    if (!vehicle) {
      return errorResponse('Vehicle not found', 404);
    }
    return jsonResponse(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return errorResponse('Failed to fetch vehicle');
  }
}

// Update vehicle
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const data = await req.json();
    const tenantId = 'test-tenant-id';

    const vehicle = await prisma.vehicle.update({
      where: { id, tenantId },
      data,
      include: {
        client: true,
      },
    });
    return jsonResponse(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return errorResponse('Failed to update vehicle');
  }
}

// Delete vehicle
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const tenantId = 'test-tenant-id';

    await prisma.vehicle.delete({
      where: { id, tenantId },
    });
    return jsonResponse({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return errorResponse('Failed to delete vehicle');
  }
}
