import type { Prisma } from "@prisma/client";

// From: https://stackoverflow.com/a/54775885/12914833
// Ensures no invalid keys, which will cause runtime errors
// Prisma relies on object literals to type return values of queries
// So we need to let typescript INFER the actual shape of the objects
// However, this leaves the possibility of invalid keys
// These will normally be considered excess properties and pass typechecking
type CheckKeysAreValid<T, ValidProps> = Exclude<keyof T, keyof ValidProps> extends never
    ? T
    : "Invalid keys" | Exclude<keyof T, keyof ValidProps>; // Hacky error message


const _selectAllInstituteInfo = {
  id: true,
  name: true,
  urlIdentifier: true,
  description_en: true,
  description_fr: true,
  is_active: true,
} as const;

export const selectAllInstituteInfo: CheckKeysAreValid<
  typeof _selectAllInstituteInfo,
  Prisma.instituteSelect
> = _selectAllInstituteInfo;

const _includeAllMemberInfo = {
  account: true,
  faculty: true,
  member_type: true,
  partnership_member_org: { include: { organization: true } },
  supervision_principal_supervisor: { select: { supervision: true } },
  current_promotion_strategy: { include: { promotion_strategy: true } },
  desired_partnership: true,
  desired_promotion_strategy: { include: { promotion_strategy: true } },
  has_keyword: { include: { keyword: true } },
  insight: true,
  problem: true,
  grant_member_involved: { include: { grant: true } },
  product_member_author: { include: { product: true } },
  institutes: {
    include: {
      institute: true,
    },
  },
} as const;

export const includeAllMemberInfo: CheckKeysAreValid<
  typeof _includeAllMemberInfo,
  Prisma.memberInclude
> = _includeAllMemberInfo;

const _includeAllAccountInfo = {
  member: { include: _includeAllMemberInfo } as const,
  instituteAdmin: {
    include: {
      institute: true,
    },
  },
} as const;

export const includeAllAccountInfo: CheckKeysAreValid<
    typeof _includeAllAccountInfo,
    Prisma.accountInclude

> = _includeAllAccountInfo;

const _selectPublicMemberInfo = {
    id: true,
    account: { select: { first_name: true, last_name: true } },
    is_active: true,
    about_me_en: true,
    about_me_fr: true,
    work_email: true,
    work_phone: true,
    website_link: true,
    twitter_link: true,
    linkedin_link: true,
    cv_link: true,
    facebook_link: true,
    tiktok_link: true,
    faculty: true,
    problem: true,
    member_type: true,
    has_keyword: { select: { keyword: true } },
    product_member_author: { select: { product: true } },
    partnership_member_org: { include: { organization: true } },
    supervision_principal_supervisor: { select: { supervision: true } },
    grant_member_involved: { select: { grant: true } },

} as const;

export const selectPublicMemberInfo: CheckKeysAreValid<
    typeof _selectPublicMemberInfo,
    Prisma.memberSelect
> = _selectPublicMemberInfo;


const _selectPublicPartnerInfo = {
  id: true,
  name_en: true,
  name_fr: true,
  org_scope: true,
  org_type: true,
  description: true,
  event_partner_involved: {
    select: {
      event: true,
      event_id: true,
      organization_id: true,
    },
  },
  partnership_member_org: {
    include: {
      member: {
        include: {
          account: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
  product_partnership: {
    select: {
      organization_id: true,
      product_id: true,
    },
  },
  organizationInstitute: {
    include: {
      institute: true,
    },
  },
} as const;


export const selectPublicPartnerInfo: CheckKeysAreValid<
    typeof _selectPublicPartnerInfo,
    Prisma.organizationSelect
> = _selectPublicPartnerInfo;

const _includeAllPartnerInfo = {
  id: true,
  name_en: true,
  name_fr: true,
  org_scope: true,
  org_type: true,
  description: true,
  event_partner_involved: { include: { event: true } },
  partnership_member_org: {
    include: { member: { include: { account: true } } },
  },
  product_partnership: { include: { product: true } },
  organizationInstitute: {
    include: {
      institute: true,
    },
  },
} as const;

export const includeAllPartnerInfo: CheckKeysAreValid<
  typeof _includeAllPartnerInfo,
  Prisma.organizationSelect
> = _includeAllPartnerInfo;

const _selectAllPartnerInfo = {
  id: true,
  name_en: true,
  name_fr: true,
  org_scope: true,
  org_type: true,
  description: true,
  event_partner_involved: {
    select: {
      event: true,
      event_id: true,
      organization_id: true,
    },
  },
  partnership_member_org: {
    include: { member: { include: { account: true } } },
  },
  product_partnership: {
    select: {
      organization_id: true,
      product_id: true,
    },
  },
  organizationInstitute: {
    include: {
      institute: true,
    },
  },
} as const;

export const selectAllPartnerInfo: CheckKeysAreValid<
    typeof _selectAllPartnerInfo,
    Prisma.organizationSelect
> = _selectAllPartnerInfo;



const _includeAllProductInfo = {
  id: true,
  title_en: true,
  title_fr: true,
  doi: true,
  publish_date: true,
  note: true,
  all_author: true,
  product_type: true,
  product_target: { include: { target: true } },
  product_partnership: { include: { organization: true } },
  product_topic: { include: { topic: true } },
  product_member_author: { include: { member: true } },
  institutes: {
    include: {
      institute: true,
    },
  },
} as const;

export const includeAllProductInfo: CheckKeysAreValid<
    typeof _includeAllProductInfo,
    Prisma.productSelect
> = _includeAllProductInfo;

const _selectAllProductInfo = {
  id: true,
  title_en: true,
  title_fr: true,
  note: true,
  doi: true,
  publish_date: true,
  all_author: true,
  peer_reviewed: true,
  product_type_id: true,
  on_going: true,
  product_type: true,
  product_target: { include: { target: true } },
  product_partnership: { include: { organization: true } },
  product_topic: { include: { topic: true } },
  institutes: {
    include: {
      institute: true,
    },
  },
  product_member_author: {
    include: {
      member: {
        include: {
          account: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
} as const;

export const selectAllProductInfo: CheckKeysAreValid<
  typeof _selectAllProductInfo,
  Prisma.productSelect
> = _selectAllProductInfo;

const _selectPublicProductInfo = {
  id: true,
  title_en: true,
  title_fr: true,
  note: true,
  doi: true,
  publish_date: true,
  product_type: true,
  all_author: true,
  product_target: { include: { target: true } },
  product_partnership: { include: { organization: true } },
  institutes: {
    include: {
      institute: true,
    },
  },
  product_member_author: {
    include: {
      member: {
        include: {
          account: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
} as const;

export const selectPublicProductInfo: CheckKeysAreValid<
    typeof _selectPublicProductInfo,
    Prisma.productSelect
> = _selectPublicProductInfo;



const _includeAllGrantInfo = {
  id: true,
  title: true,
  amount: true,
  throught_lri: true,
  status: true,
  submission_date: true,
  obtained_date: true,
  completed_date: true,
  source: true,
  topic: true,
  note: true,
  all_investigator: true,
  grant_member_involved: {
    include: { member: { include: { account: true } } },
  },
  grant_investigator_member: {
    include: { member: { include: { account: true } } },
  },
  event_grant_resulted: { include: { event: true } },
  institute: true,
} as const;

export const includeAllGrantInfo: CheckKeysAreValid<
  typeof _includeAllGrantInfo,
  Prisma.grantSelect
> = _includeAllGrantInfo;

const _selectAllGrantInfo = {
  id: true,
  title: true,
  amount: true,
  throught_lri: true,
  status: true,
  status_id: true,
  source_id: true,
  topic_id: true,
  submission_date: true,
  obtained_date: true,
  completed_date: true,
  source: true,
  topic: true,
  note: true,
  all_investigator: true,
  grant_member_involved: {
    include: { member: { include: { account: true } } },
  },
  grant_investigator_member: {
    include: { member: { include: { account: true } } },
  },
  event_grant_resulted: { include: { event: true } },
  institute: true,
} as const;

export const selectAllGrantInfo: CheckKeysAreValid<
  typeof _selectAllGrantInfo,
  Prisma.grantSelect
> = _selectAllGrantInfo;

const _selectPublicGrantInfo = {
  id: true,
  title: true,
  amount: true,
  throught_lri: true,
  status: true,
  submission_date: true,
  obtained_date: true,
  completed_date: true,
  status_id: true,
  source_id: true,
  topic_id: true,
  source: true,
  all_investigator: true,
  event_grant_resulted: { include: { event: true } },
  grant_member_involved: {
    include: {
      member: {
        include: {
          account: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
  grant_investigator_member: {
    include: {
      member: {
        include: {
          account: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
  topic: true,
  note: true,
  institute: true,
} as const;

export const selectPublicGrantInfo: CheckKeysAreValid<
  typeof _selectPublicGrantInfo,
  Prisma.grantSelect
> = _selectPublicGrantInfo;

const _includeAllEventInfo = {
  id: true,
  name_en: true,
  name_fr: true,
  start_date: true,
  end_date: true,
  event_type_id: true,
  topic_id: true,
  note: true,
  topic: true,
  event_type: true,
  event_grant_resulted: { include: { grant: true } },
  event_topic: { include: { topic: true } },
  event_member_involved: {
    include: { member: { include: { account: true } } },
  },
  event_partner_involved: { include: { organization: true } },
  event_product_resulted: { include: { product: true } },
  event_next_event_event_next_event_event_idToevent: {
    include: { event_event_next_event_next_event_idToevent: true },
  },
  event_previous_event_event_previous_event_event_idToevent: {
    include: { event_event_previous_event_previous_event_idToevent: true },
  },
  institute: true,
} as const;

export const includeAllEventInfo: CheckKeysAreValid<
  typeof _includeAllEventInfo,
  Prisma.eventSelect
> = _includeAllEventInfo;

const _selectAllEventInfo = {
  id: true,
  name_en: true,
  name_fr: true,
  start_date: true,
  end_date: true,
  event_type_id: true,
  topic_id: true,
  note: true,
  topic: true,
  event_type: true,
  event_grant_resulted: { include: { grant: true } },
  event_topic: { include: { topic: true } },
  event_member_involved: {
    include: {
      member: {
        include: {
          account: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
  event_partner_involved: {
    select: {
      organization: true,
      event_id: true,
      organization_id: true,
    },
  },
  event_product_resulted: { include: { product: true } },
  event_next_event_event_next_event_event_idToevent: {
    select: {
      event_event_next_event_next_event_idToevent: true,
      event_id: true,
      next_event_id: true,
    },
  },
  event_previous_event_event_previous_event_event_idToevent: {
    select: {
      event_event_previous_event_previous_event_idToevent: true,
      event_id: true,
      previous_event_id: true,
    },
  },
  institute: true,
} as const;

export const selectAllEventInfo: CheckKeysAreValid<
  typeof _selectAllEventInfo,
  Prisma.eventSelect
> = _selectAllEventInfo;

const _selectPublicEventInfo = {
  id: true,
  name_en: true,
  name_fr: true,
  start_date: true,
  end_date: true,
  event_type_id: true,
  event_topic: { include: { topic: true } },
  topic_id: true,
  topic: true,
  event_type: true,
  event_grant_resulted: { include: { grant: true } },
  event_member_involved: {
    include: {
      member: {
        include: {
          account: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
  event_product_resulted: { include: { product: true } },
  event_partner_involved: {
    select: {
      organization: true,
      event_id: true,
      organization_id: true,
    },
  },
  event_next_event_event_next_event_event_idToevent: {
    include: { event_event_next_event_next_event_idToevent: true },
  },
  event_previous_event_event_previous_event_event_idToevent: {
    include: { event_event_previous_event_previous_event_idToevent: true },
  },
  note: true,
  institute: true,
} as const;

export const selectPublicEventInfo: CheckKeysAreValid<
    typeof _selectPublicEventInfo,
    Prisma.eventSelect
> = _selectPublicEventInfo;


const _includeAllSupervisionInfo = {
  id: true,
  last_name: true,
  first_name: true,
  start_date: true,
  end_date: true,
  faculty_id: true,
  level_id: true,
  note: true,
  faculty: true,
  level: true,
  supervision_co_supervisor: {
    include: { member: { include: { account: true } } },
  },
  supervision_committee: {
    include: { member: { include: { account: true } } },
  },
  supervision_principal_supervisor: {
    include: { member: { include: { account: true } } },
  },
  supervision_trainee: { include: { member: { include: { account: true } } } },
  institute: true,
} as const;

export const includeAllSupervisionInfo: CheckKeysAreValid<
    typeof _includeAllSupervisionInfo,
    Prisma.supervisionSelect
> = _includeAllSupervisionInfo;

const _selectAllSupervisionInfo = {
  id: true,
  last_name: true,
  first_name: true,
  start_date: true,
  end_date: true,
  faculty_id: true,
  level_id: true,
  note: true,
  faculty: true,
  level: true,
  supervision_co_supervisor: {
    include: { member: { include: { account: true } } },
  },
  supervision_committee: {
    include: { member: { include: { account: true } } },
  },
  supervision_principal_supervisor: {
    include: { member: { include: { account: true } } },
  },
  supervision_trainee: { include: { member: { include: { account: true } } } },
  institute: true,
} as const;

export const selectAllSupervisionInfo: CheckKeysAreValid<
  typeof _selectAllSupervisionInfo,
  Prisma.supervisionSelect
> = _selectAllSupervisionInfo;

const _selectPublicSupervisionInfo = {
  id: true,
  last_name: true,
  first_name: true,
  start_date: true,
  end_date: true,
  faculty_id: true,
  level_id: true,
  faculty: true,
  level: true,
  note: true,
  supervision_co_supervisor: {
    include: { member: { include: { account: true } } },
  },
  supervision_committee: {
    include: { member: { include: { account: true } } },
  },
  supervision_principal_supervisor: {
    include: {
      member: {
        include: {
          account: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
  supervision_trainee: {
    include: {
      member: {
        include: {
          account: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
  institute: true,
} as const;

export const selectPublicSupervisionInfo: CheckKeysAreValid<
    typeof _selectPublicSupervisionInfo,
    Prisma.supervisionSelect
> = _selectPublicSupervisionInfo;
