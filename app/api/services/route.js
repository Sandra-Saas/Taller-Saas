import prisma from '../../../lib/prisma';
import { jsonResponse, errorResponse } from '../../../lib/api';

// Get all services
export async function GET(req) {
  try {
    const tenantId = 'test-tenant-id'; // TODO: Replace with real tenant from auth
    const services = await prisma.service.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    return jsonResponse(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return errorResponse('Failed to fetch services');
  }
}

// Create a service
export async function POST(req) {
  try {
    const data = await req.json();
    const tenantId = 'test-tenant-id'; // TODO: Replace with real tenant from auth

    const service = await prisma.service.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return jsonResponse(service, 201);
  } catch (error) {
    console.error('Error creating service:', error);
    return errorResponse('Failed to create service');
  }
}
