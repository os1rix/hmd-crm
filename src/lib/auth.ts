/**
 * Entra ID (Azure AD) JWT auth — wire up before Azure deployment.
 *
 * Planned flow:
 * 1. Validate Bearer token from Authorization header
 * 2. Verify signature against Entra JWKS
 * 3. Map `oid` claim to users.entraObjectId
 * 4. Enforce role-based access per hackathon personas
 */

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "sales_rep" | "tam" | "sales_manager" | "finance";
  entraObjectId: string;
};

export async function getSessionUser(_request: Request): Promise<SessionUser | null> {
  // Dev mode: no auth gate yet. Replace with Entra ID JWT validation.
  return null;
}

export function requireAuth(user: SessionUser | null): asserts user is SessionUser {
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
