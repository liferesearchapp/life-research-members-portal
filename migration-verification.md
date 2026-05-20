# Migration Verification Report

**Database:** lri-database-margi-test  
**Server:** life-app-server.database.windows.net  
**Date:** 2026-05-19  
**Status:** Migration from lri-database (production) completed successfully  

---

## Migration Summary

| Table | Row Count | Status |
| --- | --- | --- |
| institute | 1 | NEW TABLE |
| account | 154 | Migrated |
| member | 152 | Migrated |
| organization | 7 | Migrated |
| product | 13 | Migrated |
| event | 14 | Migrated |
| grant | 9 | Migrated |
| supervision | 7 | Migrated |
| memberInstitute | 152 | NEW TABLE |
| productInstitute | 13 | NEW TABLE |
| organizationInstitute | 7 | NEW TABLE |
| instituteAdmin | 0 | NEW TABLE |
| instituteMembershipInvitation | 0 | NEW TABLE |
| has_keyword | 876 | Migrated |
| insight | 130 | Migrated |
| problem | 358 | Migrated |
| event_member_involved | 45 | Migrated |
| grant_investigator_member | 7 | Migrated |
| product_member_author | 21 | Migrated |
| supervision_principal_supervisor | 8 | Migrated |

---

## 1. Institute Table (NEW)

This table did not exist in the old database. It enables multi-institute support.

| id | name | urlIdentifier | is_active |
| --- | --- | --- | --- |
| 1 | LIFE Research Institute | lri | true |

## 2. Account - `is_super_admin` Field (NEW, replaces `is_admin`)

All accounts migrated with `is_super_admin = false`. Admins must be assigned manually.

| id | login_email | first_name | last_name | is_super_admin |
| --- | --- | --- | --- | --- |
| 1 | mcric028@uottawa.ca | Michelle | Crick | false |
| 2 | guitardp@uottawa.ca | Paulette | Guitard | false |
| 3 | cranehlh@tongji.edu.cn | Lihe | Huang | false |
| 4 | jkaur3@uottawa.ca | Jasdeep | Kaur | false |
| 5 | reissing@uottawa.ca | Elke | Reissing | false |
| 6 | peter.jas@uottawa.ca | Peter | Jaskiewicz | false |
| 7 | ajrade@uottawa.ca | Ahmad | Jrade | false |
| 8 | jdilworth@ohri.ca | F. Jeffrey | Dilworth | false |
| 10 | wojtek@telfer.uottawa.ca | Wojtek | Michalowski | false |
| 13 | ksauvesc@uottawa.ca | Katrine | Sauvé-Schenk | false |

## 3. Event - `instituteId` Field (NEW, required)

Every event is now linked to an institute. All old events assigned to institute ID 1 (LRI).

| id | name_en | instituteId |
| --- | --- | --- |
| 1 | Grant submitted SSHRC | 1 |
| 2 | Introduction Housing | 1 |
| 5 | Age-friendly business Forum 2016 | 1 |
| 6 | Event1 | 1 |
| 7 | Event Blue | 1 |
| 8 | Event 3 | 1 |
| 9 | Event 4 | 1 |
| 10 | Event 5 | 1 |
| 11 | Event 6 | 1 |
| 12 | event red | 1 |
| 13 | Event 8 | 1 |
| 14 | Event 9 | 1 |
| 15 | Event 10 | 1 |
| 16 | Test 11 | 1 |

## 4. Grant - `instituteId` Field (NEW, required)

Every grant is now linked to an institute. All old grants assigned to institute ID 1 (LRI).

| id | title | amount | instituteId |
| --- | --- | --- | --- |
| 1 | Decisions for Affordable/Social Housing (DASH) System | 200000 | 1 |
| 2 | CMHC - Decisions for Affordable/Social Housing (DASH) System | 50000 | 1 |
| 3 | test grant 1 | 1200 | 1 |
| 4 | Test Grant 4 | 10000 | 1 |
| 5 | Test Grant 6 | 15000 | 1 |
| 6 | Test 5 | 0 | 1 |
| 7 | Test grant 2 | 0 | 1 |
| 8 | Test 3 | 0 | 1 |
| 9 | Test 7 | 1500 | 1 |

## 5. Supervision - `instituteId` Field (NEW, required)

Every supervision is now linked to an institute.

| id | first_name | last_name | instituteId |
| --- | --- | --- | --- |
| 1 | Luckner | Mercier | 1 |
| 4 | Chris | Hamilton | 1 |
| 10 | Ali | Chiarelli | 1 |
| 11 | Nathalie | Todam Nquepnang | 1 |
| 13 | Test  | Data | 1 |
| 14 | Hairong | Xu | 1 |
| 16 | Check | Supervision | 1 |

## 6. memberInstitute Junction Table (NEW)

Links members to institutes (many-to-many). All existing members linked to LRI.

**Total rows:** 152

Sample:

| memberId | instituteId |
| --- | --- |
| 261 | 1 |
| 262 | 1 |
| 263 | 1 |
| 264 | 1 |
| 265 | 1 |
| 266 | 1 |
| 267 | 1 |
| 268 | 1 |
| 269 | 1 |
| 270 | 1 |

## 7. productInstitute Junction Table (NEW)

Links products to institutes (many-to-many). All existing products linked to LRI.

**Total rows:** 13

| productId | instituteId |
| --- | --- |
| 4 | 1 |
| 16 | 1 |
| 17 | 1 |
| 18 | 1 |
| 19 | 1 |
| 20 | 1 |
| 21 | 1 |
| 22 | 1 |
| 24 | 1 |
| 25 | 1 |
| 30 | 1 |
| 31 | 1 |
| 32 | 1 |

## 8. organizationInstitute Junction Table (NEW)

Links partner organizations to institutes (many-to-many).

**Total rows:** 7

| organizationId | instituteId |
| --- | --- |
| 1 | 1 |
| 2 | 1 |
| 3 | 1 |
| 4 | 1 |
| 5 | 1 |
| 6 | 1 |
| 9 | 1 |

## 9. instituteAdmin Table (NEW)

Per-institute admin assignments. Empty - must be set up manually after migration.

**Total rows:** 0

## 10. instituteMembershipInvitation Table (NEW)

Invitation system for institute membership. Empty - new feature.

**Total rows:** 0

---

## Conclusion

All new schema fields and tables from the fork are present and correctly populated in `lri-database-margi-test`. The production database (`lri-database`) was **not modified** during this process.

### Key Changes from Old Schema:

1. `account.is_admin` replaced by `account.is_super_admin`
2. `event`, `grant`, `supervision` now have required `instituteId` foreign key
3. New junction tables: `memberInstitute`, `productInstitute`, `organizationInstitute`
4. New tables: `institute`, `instituteAdmin`, `instituteMembershipInvitation`
5. Multi-institute (multi-tenant) architecture fully operational
