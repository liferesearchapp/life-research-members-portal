# Migration Verification Report

- Generated: 2026-08-23T02:26:57.431Z
- Source: life-database
- Reference: lri-database-margi-test
- Target: lri-database-production-v2
- Result: PASS

| Status | Check | Details |
| --- | --- | --- |
| PASS | Database separation | source=life-database, reference=lri-database-margi-test, target=lri-database-production-v2 |
| PASS | Only approved institutes | found lri, dlri |
| PASS | Institute branding and settings | LRI and DLRI institute rows match the approved Margi-test reference |
| PASS | Production admins became LRI admins | 14/14 exact account assignments |
| PASS | DLRI admins preserved | 3 approved DLRI admin assignments |
| PASS | Super-admin list | 4 exact approved super-admin accounts |
| PASS | Admin-only production accounts remain non-members | 7 admin-only accounts have no member profiles |
| PASS | Institute administrators are independent of members | instituteAdmin contains only account and institute assignments |
| PASS | account count | expected 231, found 231 |
| PASS | member count | expected 217, found 217 |
| PASS | organization count | expected 12, found 12 |
| PASS | product count | expected 993, found 993 |
| PASS | event count | expected 25, found 25 |
| PASS | grant count | expected 59, found 59 |
| PASS | supervision count | expected 24, found 24 |
| PASS | insight count | expected 139, found 139 |
| PASS | member_type count | expected 8, found 8 |
| PASS | Approved reference-only member type | 2/2 rows match Margi-test exactly |
| PASS | Approved reference-only account data | 6/6 approved rows match Margi-test exactly |
| PASS | Approved reference-only member data | 6/6 approved rows match Margi-test exactly |
| PASS | Approved reference-only organization data | 1/1 approved rows match Margi-test exactly |
| PASS | Approved reference-only product data | 1/1 approved rows match Margi-test exactly |
| PASS | Approved reference-only event data | 1/1 approved rows match Margi-test exactly |
| PASS | Approved reference-only grant data | 1/1 approved rows match Margi-test exactly |
| PASS | Approved reference-only insight data | 1/1 approved rows match Margi-test exactly |
| PASS | event_type production count | expected 9, found 9 |
| PASS | faculty production count | expected 10, found 10 |
| PASS | keyword production count | expected 820, found 820 |
| PASS | level production count | expected 6, found 6 |
| PASS | org_scope production count | expected 5, found 5 |
| PASS | org_type production count | expected 5, found 5 |
| PASS | product_type production count | expected 42, found 42 |
| PASS | promotion_strategy production count | expected 9, found 9 |
| PASS | source production count | expected 14, found 14 |
| PASS | status production count | expected 6, found 6 |
| PASS | target production count | expected 9, found 9 |
| PASS | topic production count | expected 3, found 3 |
| PASS | has_keyword production count | expected 1507, found 1507 |
| PASS | problem production count | expected 538, found 538 |
| PASS | desired_partnership production count | expected 0, found 0 |
| PASS | current_promotion_strategy production count | expected 23, found 23 |
| PASS | desired_promotion_strategy production count | expected 7, found 7 |
| PASS | partnership_member_org production count | expected 6, found 6 |
| PASS | event_member_involved production count | expected 139, found 139 |
| PASS | event_grant_resulted production count | expected 3, found 3 |
| PASS | event_partner_involved production count | expected 4, found 4 |
| PASS | event_product_resulted production count | expected 7, found 7 |
| PASS | event_topic production count | expected 7, found 7 |
| PASS | event_next_event production count | expected 2, found 2 |
| PASS | event_previous_event production count | expected 3, found 3 |
| PASS | event_event production count | expected 0, found 0 |
| PASS | grant_investigator_member production count | expected 3, found 3 |
| PASS | grant_member_involved production count | expected 87, found 87 |
| PASS | product_member_author production count | expected 1310, found 1310 |
| PASS | product_member_all_author production count | expected 3, found 3 |
| PASS | product_partnership production count | expected 16, found 16 |
| PASS | product_target production count | expected 39, found 39 |
| PASS | product_topic production count | expected 2, found 2 |
| PASS | supervision_co_supervisor production count | expected 1, found 1 |
| PASS | supervision_committee production count | expected 1, found 1 |
| PASS | supervision_principal_supervisor production count | expected 24, found 24 |
| PASS | supervision_trainee production count | expected 3, found 3 |
| PASS | legacy production count | expected 130, found 130 |
| PASS | LRI member relationships | 215 LRI memberships |
| PASS | LRI active members | expected 206, found 206 |
| PASS | LRI product relationships | 992 production products assigned to LRI |
| PASS | LRI organization relationships | 11 production organizations assigned to LRI |
| PASS | memberInstitute DLRI relationships | 4 approved relationships |
| PASS | productInstitute DLRI relationships | 1 approved relationships |
| PASS | organizationInstitute DLRI relationships | 1 approved relationships |
| PASS | Approved member profile overlays | 1/1 profiles match Margi-test |
| PASS | Corrected LRI topics | 3 approved active-topic rows |
| PASS | Approved DLRI organization 12 | present and assigned to DLRI |
| PASS | Approved DLRI product 1081 | present and assigned to DLRI |
| PASS | Approved DLRI event 25 | present and assigned to DLRI |
| PASS | Approved DLRI grant 62 | present and assigned to DLRI |
| PASS | Test records excluded | abc, Margi, and Buddy Test are absent |
| PASS | Database constraints | no violations |

All approved migration rules passed.
