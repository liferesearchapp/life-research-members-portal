/**
 * May this account manage that member's private profile?
 *
 * A super admin always may. An institute admin may when they administer at least one institute the
 * member belongs to. Everyone else may not.
 *
 * Pure, and separate from the component, because the bug this replaced was not in the rule but in
 * *when the rule ran*: the profile evaluated it during the first render, while the member was still
 * loading. An unloaded member has no institutes, no institute overlapped, and the institute admin
 * was redirected away before their data ever arrived. Super admins never saw it, because the check
 * short-circuits for them -- which is exactly why this looked like "editing works for super admins
 * only".
 *
 * `undefined` means "not answerable yet" and is deliberately not `false`: a caller must wait for
 * the member to load rather than treat unknown as denied.
 */
export function canManageMemberProfile(args: {
  isSuperAdmin: boolean;
  adminInstituteIds: number[];
  memberInstituteIds: number[] | undefined;
}): boolean | undefined {
  const { isSuperAdmin, adminInstituteIds, memberInstituteIds } = args;

  if (isSuperAdmin) return true;
  if (memberInstituteIds === undefined) return undefined; // still loading

  return adminInstituteIds.some((id) => memberInstituteIds.includes(id));
}
