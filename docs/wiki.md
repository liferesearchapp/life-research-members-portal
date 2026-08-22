# Combined React 19 Portal: User-Facing Change Guide

## Purpose of this page

This page describes the user-visible changes delivered by the combined React 19 portal work. It is written for portal users, institute administrators, super admins, reviewers, and stakeholders. It focuses on what people see, where they find it, and how the updated workflows behave.

The portal has changed from a LIFE Research Institute-specific application into a reusable, multi-institute research portal. A person can select an institute and use an institute-specific version of the portal with the correct content, navigation, language, branding, membership, and administrative permissions.

This page reflects the intended final state after `feature/new-search-functionality` is merged into `combined/react19-portal-complete`.

## Summary of the experience

The major visible changes are:

- Users select the institute they want to visit from the navigation bar.
- Each institute has its own URL, landing page, name, description, logos, and colours.
- Lists and dashboards show information for the selected institute.
- Navigation changes according to the user's role in the selected institute.
- Members can maintain their profiles and work with institute content.
- Institute administrators can manage their institute's accounts and research content.
- Super admins can manage every institute and assign super-admin privileges to another account.
- The portal prevents account deletion from leaving the system without a super admin.
- Account membership is managed per institute, so one account can belong to multiple institutes.
- English and French institute information is supported throughout the portal.
- Members can use free-text search alongside the existing filters on the Members page.

## Before and after

| Area | Previous experience | Updated experience |
| --- | --- | --- |
| Portal scope | The application was centred on one research institute. | One application supports multiple institutes. |
| Navigation | Pages were reached through shared, non-institute routes. | Portal pages use the selected institute's URL identifier, such as `/lri/members`. |
| Branding | The portal used a common LIFE identity. | Each institute can have its own bilingual name, descriptions, logos, and colour theme. |
| Content | Lists could appear shared across the portal. | Members, products, partners, grants, events, supervisions, accounts, and topics are scoped to the selected institute. |
| Roles | Permissions were less clearly tied to institute membership. | Member and administrator access is evaluated for the selected institute; super admins retain portal-wide access. |
| Accounts | Account, member, and administrator status were closely coupled. | An account can have a member profile and can belong to or administer multiple institutes. |
| Account safeguards | Account removal did not fully protect the portal's final super-admin role. | Super-admin assignment and account-removal safeguards ensure that at least one super admin remains available. |
| Institute administration | There was no complete institute-management experience. | Institutes can be listed, created, viewed, branded, activated, and edited according to permission. |
| Member discovery | Members were primarily found through individual filters. | A free-text search can search across several member fields and work with the existing filters. |

## 1. Entering the portal and selecting an institute

### First visit

1. Open the portal home page.
2. Use **Select Institute** in the navigation bar.
3. Choose an active institute from the list.
4. The portal opens the selected institute's home page.

The institute becomes part of the page URL. For example, selecting LIFE Research Institute opens the `lri` section of the portal. Moving between institute-specific pages keeps the selected institute in the URL.

If a user changes the institute while viewing an institute page, the portal keeps the same type of page when possible and replaces the institute portion of the URL. For example, changing institutes while viewing Members opens the Members page for the newly selected institute.

Only active institutes appear in the institute selector.

### Returning to the portal

When an institute has already been selected, the root page redirects to that institute's home page. Users can change institutes at any time through the selector.

## 2. Institute-specific identity and home page

After selecting an institute, users see an institute-specific portal experience:

- The navigation logo uses the selected institute's small logo.
- English and French modes can use different small logos.
- The home page uses the institute's large logo.
- The institute's English or French name appears according to the selected language.
- The institute description appears on the home page.
- Buttons, highlights, and other branded elements use the institute's configured colours.
- If optional branding is not configured, safe default portal branding is used.

The home page includes a greeting appropriate to the user's session and role. It also presents an at-a-glance view of institute content, including counts for areas such as members, products, partners, grants, events, and supervisions when the user has access to them.

## 3. English and French experience

The **EN/FR** control continues to switch the portal language. The multi-institute work extends this behaviour to institute information:

- Institutes can have separate English and French names.
- Institutes can have separate English and French descriptions.
- Institutes can use separate English and French navigation logos.
- The selected institute's localized name is used in navigation and welcome messages.
- If a French institute name is not provided, the English name is used as the fallback.

Forms, buttons, permission messages, confirmation dialogs, filters, and account-management controls continue to provide English and French labels.

## 4. Navigation by role

The navigation bar displays only the areas that are relevant to the current user and selected institute.

| User type | Main visible access |
| --- | --- |
| Visitor or signed-out user | Institute selection, language selection, login, and the selected institute's public home experience. |
| Registered account without a member profile | Institute home and **My Profile**, where the person can create a member profile when eligible. |
| Institute member | Home, Members, Products, Partners, Institutes visible to them, and My Profile. |
| Institute administrator | Member access plus Grants, Events, Supervisions, Grant Topics, Accounts, account registration, and management actions for the selected institute. |
| Super admin | Portal-wide access across all institutes, including institute creation and management and super-admin assignment. |

The avatar menu shows the signed-in person's name and email and identifies relevant roles such as **Member**, **Administrator**, and **Super Admin**.

Permissions are based on the selected institute. A person may be an administrator in one institute and a regular member in another, so the navigation can change when they switch institutes.

## 5. Institute-scoped content

The primary research areas now follow the selected institute:

- Members
- Products
- Partners
- Grants
- Events
- Supervisions
- Grant Topics
- Accounts

Opening a list shows records associated with the selected institute. Switching institutes refreshes the visible information for the new institute.

This makes it possible for one deployment of the portal to support multiple research communities without presenting every institute's administrative information together.

## 6. Members

### Viewing members

Institute members, administrators, and super admins can open **Members** from the navigation bar. The list provides sortable information, optional columns, and filters such as member name, faculty, member type, and keyword.

Selecting a member opens the profile information that the current user is authorized to see.

### Free-text member search

The Members page includes a **Search** field. The search is case-insensitive and supports partial text. It checks:

- Member name
- Faculty name in English or French
- Member type in English or French
- Keywords in English or French
- About Me information in English or French
- Problems in English or French

The free-text search works together with the existing member filters. Clearing the search field removes only the search text. Selecting **Reset** clears the search and resets the page filters.

When several words are entered, a member can appear when any entered word partially matches one of the searchable fields. This keeps the search broad while the existing faculty, member-type, name, and keyword filters can be used to narrow the results further.

### My Profile

Signed-in users can open **My Profile** to view and edit their information. A member profile separates information into:

- **Public** information
- **Private** information
- **Insight** information for administrators where applicable

The page warns users before discarding unsaved changes when moving between editing areas.

Users without a member profile are presented with an option to register as a member. When an institute invitation is pending, the invitation appears above the profile with options to accept or reject it.

Members can also start supported partner and supervision workflows from their profile.

## 7. Products

The Products page is scoped to the selected institute and supports:

- Sorting and filtering product records
- Selecting which columns are visible
- Viewing public product information
- Viewing or editing additional information when authorized
- Associating authors and institute information with products
- Adding a new product when the user's role permits it
- Resetting filters and display selections

Product controls and private information are shown according to the user's relationship to the product and their role in the selected institute.

## 8. Partners

The Partners page shows organizations associated with the selected institute. Users can:

- Filter and sort partners
- Choose visible columns
- Open partner profiles
- View public partner information
- Add or edit partner information when authorized
- Associate members with partner organizations
- Reset the active filters

Partner creation is available from supported list and member-profile workflows when the signed-in user has permission.

## 9. Grants

Institute administrators and super admins can use the Grants area for the selected institute. The page supports:

- Institute-scoped grant lists
- Filtering by grant-related information
- Selectable columns
- Public and private grant information according to permission
- Creating and updating grants
- Associating members and topics with grants
- Resetting filters

Grant dates and optional submission information have also been made more tolerant of incomplete values so users are not forced to enter an unavailable date.

## 10. Events

Institute administrators and super admins can use the Events area to:

- View institute-specific events
- Filter by name, type, and date
- Choose visible columns
- Register new events
- View and edit permitted event information
- Reset filters

Event date entry and display use the updated date controls introduced during the portal modernization.

## 11. Supervisions

The Supervisions area is scoped to the selected institute. Depending on their role and relationship to a supervision, users can:

- View supervision records
- Filter and sort the list
- Choose visible columns
- Register a supervision through supported workflows
- Associate supervisors and members
- View or edit permitted information
- Reset filters

Administrative actions remain restricted to eligible institute administrators and super admins.

## 12. Grant Topics

Institute administrators and super admins can open **Grant Topics** for the selected institute.

The topic manager allows an authorized user to:

1. Add an English and French topic name.
2. View the institute's topics in a table.
3. Edit existing English and French names.
4. Control whether a topic is available for new grants.

Topics are managed separately for each institute, so institutes can maintain their own grant classifications.

## 13. Institute directory and profiles

Users with institute access can open **Institutes** to see the institutes available to them. The table displays information such as:

- English name
- French name
- URL identifier
- Active status
- English description
- French description

Selecting a row opens the institute profile.

### Viewing an institute

The institute profile displays the institute's localized information and branding. Members can view institute information available to them.

### Editing an institute

An administrator of the institute or a super admin can select **Edit** to update permitted institute information, including:

- English and French names
- English and French descriptions
- Active status
- Large landing-page logo
- English and French small navigation logos
- Primary, secondary, dark-variant, and accent colours

Branding fields include previews and fallbacks so an administrator can understand how the selected images and colours will appear.

Deactivating an institute removes it from the normal institute selector while preserving its configured record for administration.

## 14. Creating an institute

Only a super admin sees **Add Institute** on the institute list.

The creation form collects:

- English name
- Optional French name
- URL identifier
- English and French descriptions
- Optional large and small logos
- Optional brand colours

After a successful creation, the institute lists and selector information refresh. The new institute must be active before it appears in the normal selector.

## 15. Accounts and institute membership

Institute administrators and super admins can open **Accounts** for the selected institute. The table shows account and member information such as:

- First and last name
- Login email
- Administrator status for the selected institute
- Member status for the selected institute
- Member active status
- Work contact information

Selecting an account opens its account profile.

### Creating or adding an account

The account-registration form allows an administrator to provide a name and login email and select one or more institutes they are allowed to manage.

If the email is new, the portal creates an account. If the email already belongs to an account from another institute, the existing account can be added to the selected institute instead of creating a duplicate person.

Eligible administrators can also choose whether the account should be registered as a member or granted institute-administrator privileges. Super admins have the additional ability to grant super-admin privileges.

### Account profile controls

Depending on permission, the account profile can show controls to:

- Change the person's name or login email
- Grant or remove administrator privileges for the selected institute
- Open, create, or delete the associated member profile
- View the institutes associated with the account
- Add the account to another manageable institute
- Remove the account from a manageable institute
- View pending institute invitations
- Delete the account

Institute administrators can act only within institutes they manage. Super admins can work across all institutes.

## 16. Super Admin Privileges

When a super admin views another account, the account profile includes **Super Admin Privileges**.

If the account is not a super admin:

1. Select **Grant super admin privileges**.
2. Review the confirmation message explaining the level of access.
3. Select **Confirm**.
4. The account profile refreshes and shows that the account has super-admin privileges.

The control is not displayed to regular members or institute administrators. Super-admin status gives the account access to manage every institute and account, so it should be granted only to trusted portal administrators.

Granting the privilege is an immediate role change. After confirmation, the selected account receives the same portal-wide super-admin capabilities, including institute management, account management, and the ability to grant super-admin privileges to another trusted account.

## 17. Account deletion safeguards

Account deletion remains a high-impact action and requires confirmation. The portal applies additional safeguards:

- A person cannot delete their own account.
- A non-super-admin cannot delete a super-admin account.
- The final remaining super-admin account cannot be deleted.
- Another account must receive super-admin privileges before the final super admin could otherwise be removed.
- If multiple super-admin account-removal requests overlap, the portal protects the final remaining super admin rather than allowing every super-admin account to be removed.
- If account information changes in a way that prevents deletion from completing safely, the deletion is stopped and the user is asked to try again.
- Related institute-administrator and membership associations are handled as part of account removal.

Deactivating a member profile is separate from deleting an account. Member active status does not itself remove the account's portal role.

Automated verification covers authorized and unauthorized super-admin assignment, final-super-admin protection, overlapping super-admin deletion attempts, account-role changes during deletion, and the documented English and French member-search fields.

## 18. Filters, columns, and Reset behaviour

The list pages use a consistent interaction model:

- Filters narrow the currently selected institute's records.
- Sort controls order table columns.
- **Show Columns** controls allow users to display the information relevant to them.
- **Reset** or **Reset the filter** clears the active filter selections and refreshes the expected default view.
- Selector fields provide searchable lists where a user must choose an existing member, product, partner, grant, or event.

These behaviours apply across areas such as Members, Products, Partners, Grants, Events, and Supervisions.

## 19. Permission and privacy expectations

The updated portal separates access by role and by institute:

- Public and private profile sections are displayed according to permission.
- Members can manage their own permitted information.
- Institute administrators can manage content and accounts associated with their institutes.
- Being an administrator in one institute does not automatically make a person an administrator in another.
- Super admins can access and manage all institutes.
- Unauthorized pages display a clear authorization message.
- Hidden buttons are backed by permission checks; visibility alone is not treated as authorization.

## 20. Suggested reviewer walkthrough

The following walkthrough verifies the main user-facing story of the combined portal.

### Institute selection and branding

1. Open the portal without an institute selected.
2. Confirm that **Select Institute** lists active institutes.
3. Select LIFE Research Institute.
4. Confirm the `lri` URL, institute logo, name, description, and colours.
5. Change the language and confirm localized institute information.
6. Switch to another institute and confirm that branding and content change.

### Member experience

1. Sign in as an institute member.
2. Confirm that member navigation is visible and admin-only navigation is hidden.
3. Open Members and use the standard filters.
4. Enter a partial word in **Search** and confirm relevant member matches.
5. Combine Search with another filter.
6. Select **Reset** and confirm the search and filters clear.
7. Open My Profile and review the Public and Private areas.

### Institute administrator experience

1. Sign in as an institute administrator.
2. Confirm that Grants, Events, Supervisions, Grant Topics, and Accounts appear.
3. Switch to an institute where the person is not an administrator and confirm the navigation changes.
4. Open Accounts and select an account associated with the managed institute.
5. Review institute administrator and membership controls.
6. Open the institute profile and confirm that editing is available only for a manageable institute.

### Super-admin experience

1. Sign in as a super admin.
2. Open Institutes and confirm that **Add Institute** is visible.
3. Review the institute creation and branding fields without submitting test data.
4. Open an existing account that is not a super admin.
5. Confirm that **Super Admin Privileges** and **Grant super admin privileges** appear.
6. Open the confirmation and cancel unless the test account is intended to be promoted.
7. Confirm that a non-super-admin session cannot see or use this control.
8. Using disposable test accounts, grant super-admin privileges to another account and confirm that its account profile updates immediately.
9. Confirm that a non-super-admin cannot remove a super-admin account.
10. Confirm that the portal rejects any account-removal action that could leave no super admin available.
