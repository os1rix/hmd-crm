import type { SessionUser } from "@/lib/session";

type ApprovalLike = { status: string; approverRole: string };

/** Sales managers can action any pending step; others only their own role's step. */
export function canDecideOfferApproval(
  userRole: SessionUser["role"] | null | undefined,
  approval: ApprovalLike,
): boolean {
  if (!userRole || approval.status !== "pending") return false;
  if (userRole === "sales_manager") return true;
  return approval.approverRole === userRole;
}
