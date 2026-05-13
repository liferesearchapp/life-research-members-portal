export const instituteMembershipInvitationStatus = {
  pending: "PENDING",
  accepted: "ACCEPTED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
} as const;

export type InstituteMembershipInvitationStatus =
  (typeof instituteMembershipInvitationStatus)[keyof typeof instituteMembershipInvitationStatus];

export function isPendingInstituteMembershipInvitation(status: string) {
  return status === instituteMembershipInvitationStatus.pending;
}
