import prisma from '../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../lib/api';

// Get all vehicles
export async function GET(req) {
  try {
    const tenantId = 'test-tenant-id'; // TODO: Replace with real tenant from auth
    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId },
      include: {
        client: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return jsonResponse(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return errorResponse('Failed to fetch vehicles');
  }
}

// Create a vehicle
export async function POST(req) {
  try {
    const data = await req.json();
    const tenantId = 'test-tenant-id'; // TODO: Replace with real tenant from auth

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        client: true,
      },
    });

    return jsonResponse(vehicle, 201);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return errorResponse('Failed to create vehicle');
  }
}
