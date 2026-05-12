import type { NextApiResponse } from "next";

type AuthenticatedAccount = {
  id: number;
  is_super_admin: boolean;
  instituteAdmin: Array<
    { instituteId: number } | { institute: { id: number } | null }
  >;
  member: {
    id: number;
    institutes: Array<
      { instituteId: number } | { institute: { id: number } | null }
    >;
    product_member_author: Array<
      { product_id: number } | { product: { id: number } | null }
    >;
    partnership_member_org: Array<
      { organization_id: number } | { organization: { id: number } | null }
    >;
    grant_member_involved: Array<
      { grant_id: number } | { grant: { id: number } | null }
    >;
    supervision_principal_supervisor: Array<
      { supervision_id: number } | { supervision: { id: number } | null }
    >;
  } | null;
};

type InstituteAccessOptions = {
  allowAdmin?: boolean;
  allowMember?: boolean;
  allowSuperAdmin?: boolean;
};

type AccountAccessTarget = {
  id: number;
  member: {
    institutes: Array<
      { instituteId: number } | { institute: { id: number } | null }
    >;
  } | null;
};

function getUniqueInstituteIds(ids: Iterable<number | null | undefined>) {
  const values = new Set<number>();
  for (const id of ids) {
    if (typeof id === "number" && Number.isFinite(id)) values.add(id);
  }
  return values;
}

export function getManagedInstituteIds(account: AuthenticatedAccount) {
  return getUniqueInstituteIds(
    account.instituteAdmin.map((admin) =>
      "instituteId" in admin ? admin.instituteId : admin.institute?.id
    )
  );
}

export function getMemberInstituteIds(account: AuthenticatedAccount) {
  return getUniqueInstituteIds(
    account.member?.institutes.map((entry) =>
      "instituteId" in entry ? entry.instituteId : entry.institute?.id
    ) ?? []
  );
}

export function hasAdministrativeRole(account: AuthenticatedAccount) {
  return account.is_super_admin || account.instituteAdmin.length > 0;
}

export function isCurrentMember(account: AuthenticatedAccount, memberId: number) {
  return account.member?.id === memberId;
}

export function isProductAuthor(account: AuthenticatedAccount, productId: number) {
  return (
    account.member?.product_member_author.some(
      (author) =>
        ("product_id" in author ? author.product_id : author.product?.id) === productId
    ) ?? false
  );
}

export function isPartnerMember(account: AuthenticatedAccount, partnerId: number) {
  return (
    account.member?.partnership_member_org.some(
      (entry) =>
        ("organization_id" in entry ? entry.organization_id : entry.organization?.id) ===
        partnerId
    ) ?? false
  );
}

export function isGrantParticipant(
  account: AuthenticatedAccount,
  memberIds: Iterable<number | null | undefined>
) {
  if (!account.member) return false;
  const allowedMemberIds = getUniqueInstituteIds(memberIds);
  return allowedMemberIds.has(account.member.id);
}

export function isPrincipalSupervisor(
  account: AuthenticatedAccount,
  supervisionId: number
) {
  return (
    account.member?.supervision_principal_supervisor.some(
      (entry) =>
        ("supervision_id" in entry ? entry.supervision_id : entry.supervision?.id) ===
        supervisionId
    ) ?? false
  );
}

export function hasAnyInstituteAdminAccess(
  account: AuthenticatedAccount,
  instituteIds: Iterable<number | null | undefined>
) {
  const allowedIds = getUniqueInstituteIds(instituteIds);
  if (allowedIds.size === 0) return false;
  const managedInstituteIds = getManagedInstituteIds(account);
  for (const instituteId of allowedIds) {
    if (managedInstituteIds.has(instituteId)) return true;
  }
  return false;
}

export function hasAllInstituteAdminAccess(
  account: AuthenticatedAccount,
  instituteIds: Iterable<number | null | undefined>
) {
  const allowedIds = getUniqueInstituteIds(instituteIds);
  if (allowedIds.size === 0) return false;
  const managedInstituteIds = getManagedInstituteIds(account);
  for (const instituteId of allowedIds) {
    if (!managedInstituteIds.has(instituteId)) return false;
  }
  return true;
}

export function hasAnyInstituteMemberAccess(
  account: AuthenticatedAccount,
  instituteIds: Iterable<number | null | undefined>
) {
  const allowedIds = getUniqueInstituteIds(instituteIds);
  if (allowedIds.size === 0) return false;
  const memberInstituteIds = getMemberInstituteIds(account);
  for (const instituteId of allowedIds) {
    if (memberInstituteIds.has(instituteId)) return true;
  }
  return false;
}

export function hasAllInstituteMemberAccess(
  account: AuthenticatedAccount,
  instituteIds: Iterable<number | null | undefined>
) {
  const allowedIds = getUniqueInstituteIds(instituteIds);
  if (allowedIds.size === 0) return false;
  const memberInstituteIds = getMemberInstituteIds(account);
  for (const instituteId of allowedIds) {
    if (!memberInstituteIds.has(instituteId)) return false;
  }
  return true;
}

export function hasAnyInstituteAccess(
  account: AuthenticatedAccount,
  instituteIds: Iterable<number | null | undefined>,
  {
    allowAdmin = true,
    allowMember = false,
    allowSuperAdmin = true,
  }: InstituteAccessOptions = {}
) {
  if (allowSuperAdmin && account.is_super_admin) return true;
  if (allowAdmin && hasAnyInstituteAdminAccess(account, instituteIds)) return true;
  if (allowMember && hasAnyInstituteMemberAccess(account, instituteIds)) return true;
  return false;
}

export function canAccessAccount(
  account: AuthenticatedAccount,
  target: AccountAccessTarget,
  { allowSelf = false }: { allowSelf?: boolean } = {}
) {
  if (account.is_super_admin) return true;
  if (allowSelf && account.id === target.id) return true;
  if (!target.member) return hasAdministrativeRole(account);
  const instituteIds = target.member.institutes.map((entry) =>
    "instituteId" in entry ? entry.instituteId : entry.institute?.id
  );
  if (instituteIds.length === 0) return hasAdministrativeRole(account);
  return hasAnyInstituteAdminAccess(account, instituteIds);
}

export function hasAllInstituteAccess(
  account: AuthenticatedAccount,
  instituteIds: Iterable<number | null | undefined>,
  {
    allowAdmin = true,
    allowMember = false,
    allowSuperAdmin = true,
  }: InstituteAccessOptions = {}
) {
  if (allowSuperAdmin && account.is_super_admin) return true;
  if (allowAdmin && hasAllInstituteAdminAccess(account, instituteIds)) return true;
  if (allowMember && hasAllInstituteMemberAccess(account, instituteIds)) return true;
  return false;
}

export function assertAuthorized(
  res: NextApiResponse,
  authorized: boolean,
  message: string
) {
  if (authorized) return true;
  res.status(401).send(message);
  return false;
}
