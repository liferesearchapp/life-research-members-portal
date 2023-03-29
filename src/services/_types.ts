import type { keyword, problem, target, topic, organization, member } from "@prisma/client";
import type { AccountRes } from "../pages/api/account/[id]";
import type { PrivateMemberRes } from "../pages/api/member/[id]/private";
import type { PublicMemberRes } from "../pages/api/member/[id]/public";
import type { PublicPartnerRes } from "../pages/api/partner/[id]/public";
import type { PrivatePartnerRes } from "../pages/api/partner/[id]/private";
import type { PublicProductRes } from "../pages/api/product/[id]/public";
import type { PublicGrantRes } from "../pages/api/grant/[id]/public";
import type { PrivateGrantRes } from "../pages/api/grant/[id]/private";
import type { PrivateEventRes } from "../pages/api/event/[id]/private";
import type { PrivateProductRes } from "../pages/api/product/[id]/private";
import type { PublicEventRes } from "../pages/api/event/[id]/public";
import type { PublicSupervisionRes } from "../pages/api/supervision/[id]/public";
import type { PrivateSupervisionRes } from "../pages/api/supervision/[id]/private";


export type AccountInfo = NonNullable<AccountRes>;
export type MemberPublicInfo = NonNullable<PublicMemberRes>;
export type PartnerPublicInfo = NonNullable<PublicPartnerRes>;
export type PartnerPrivateInfo = NonNullable<PrivatePartnerRes>;
export type MemberPrivateInfo = NonNullable<PrivateMemberRes>;
export type ProductPublicInfo = NonNullable<PublicProductRes>;
export type ProductPrivateInfo = NonNullable<PrivateProductRes>;
export type GrantPublicInfo = NonNullable<PublicGrantRes>;
export type GrantPrivateInfo = NonNullable<PrivateGrantRes>;
export type EventPrivateInfo = NonNullable<PrivateEventRes>;
export type EventPublicInfo = NonNullable<PublicEventRes>;
export type SupervisionPublicInfo = NonNullable<PublicSupervisionRes>;
export type SupervisionPrivateInfo = NonNullable<PrivateSupervisionRes>;
export type ProblemInfo = Omit<problem, "id" | "member_id">;
export type KeywordInfo = Omit<keyword, "id">;
export type TargetInfo = Omit<target, "id">;
export type TopicInfo = Omit<topic, "id">;
export type OrganizationInfo = Omit<organization, "id">;

