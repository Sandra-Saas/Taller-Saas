export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper to get tenant ID (we'll need to implement this properly with auth)
export function getTenantId(req) {
  // For now, placeholder - will integrate with AuthContext later
  return 'test-tenant-id';
}