import prisma from './prisma';
import crypto from 'crypto';

export function generateAPIKey() {
  const key = `ts_${crypto.randomBytes(24).toString('hex')}`;
  return key;
}

export async function verifyAPIKey(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }
  const key = authorizationHeader.split('Bearer ')[1];
  if (!key) return null;

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      key,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      tenant: true
    }
  });

  if (apiKey) {
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    });
  }

  return apiKey;
}
