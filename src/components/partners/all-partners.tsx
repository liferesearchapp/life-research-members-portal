// This is a component that displays a table of partners (organizations), with filters to filter the partners based on name, type and scope
// The component also has buttons to create new partner when login in as an administrator and clear the filters.
// The component also updates the URL query parameters based on the filter values and the query parameters are used to update the filters on component mount.

import Button from "antd/lib/button";
import Table, { ColumnType } from "antd/lib/table";
import Title from "antd/lib/typography/Title";
import {
  FC,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import PageRoutes from "../../routing/page-routes";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import SafeLink from "../link/safe-link";
import Router, { useRouter } from "next/router";
import Form from "antd/lib/form";
import blurActiveElement from "../../utils/front-end/blur-active-element";
import { Checkbox } from "antd";
import type { ParsedUrlQueryInput } from "querystring";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import type { PartnerPublicInfo } from "../../services/_types";
import { AllPartnersCtx } from "../../services/context/all-partners-ctx";
import OrgTypeFilter from "../filters/org-type-filter";
import OrgScopeFilter from "../filters/org-scope-filter";
import OrgNameFilter from "../filters/org-name-filter";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

function nameSorter(en: boolean) {
  return (
    a: { name_en: string; name_fr: string },
    b: { name_en: string; name_fr: string }
  ) => {
    const nameA = en ? a.name_en : a.name_fr;
    const nameB = en ? b.name_en : b.name_fr;
    return nameA.localeCompare(nameB);
  };
}

function getName(organization: PartnerPublicInfo, en: boolean) {
  return en ? organization.name_en : organization.name_fr;
}

function filterFn(
  m: PartnerPublicInfo & { name: string },
  filters: {
    nameFilter: Set<number>;
    typeFilter: Set<number>;
    scopeFilter: Set<number>;
  }
): boolean {
  const { nameFilter, typeFilter, scopeFilter } = filters;
  if (nameFilter.size > 0 && !nameFilter.has(m.id)) return false;

  if (typeFilter.size > 0) {
    if (!m.org_type && !typeFilter.has(0)) return false; // id 0 is for null
    if (m.org_type && !typeFilter.has(m.org_type.id)) return false;
  }
  if (scopeFilter.size > 0) {
    if (!m.org_scope && !scopeFilter.has(0)) return false; // id 0 is for null
    if (m.org_scope && !scopeFilter.has(m.org_scope.id)) return false;
  }

  return true;
}

// Use query params for filters - for bookmarking, back button etc.
export const queryKeys = {
  showType: "showType",
  showScope: "showScope",
  partnerType: "partnerType",
  partnerScope: "partnerScope",
  orgIds: "orgIds",
} as const;

// Don't want to change url if query is default value
const defaultQueries = {
  showType: true,
  showScope: true,
} as const;

function handleNameFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.orgIds]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handlePartnerTypeFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.partnerType]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handlePartnerScopeFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.partnerScope]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleShowScopeChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showScope]: value,
  };
  if (value === defaultQueries.showScope) delete query[queryKeys.showScope];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowTypeChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showType]: value,
  };
  if (value === defaultQueries.showType) delete query[queryKeys.showType];
  Router.push({ query }, undefined, { scroll: false });
}

function clearQueries() {
  Router.push({ query: null }, undefined, { scroll: false });
}

function getIdsFromQueryParams(key: string): Set<number> {
  const res = new Set<number>();
  const query = Router.query[key];
  if (!query) return res;
  if (typeof query === "string") {
    const id = parseInt(query);
    if (!isNaN(id)) res.add(id);
  } else {
    for (const keyword of query) {
      const id = parseInt(keyword);
      if (!isNaN(id)) res.add(id);
    }
  }
  return res;
}

function getPopupContainer(): HTMLElement {
  return (
    document.querySelector(".all-organizations-table .filters") || document.body
  );
}

const AllPartners: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();

  const {
    allPartners,
    loading,
    refresh: refreshOrganizations,
  } = useContext(AllPartnersCtx);

  const { localAccount } = useContext(ActiveAccountCtx);

  const handleRegisterPartner = () => {
    if (institute) {
      router.push({
        pathname: "/[instituteId]/partners/register",
        query: { instituteId: institute.urlIdentifier },
      });
    }
  };

  useEffect(() => {
    refreshOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showType, setShowType] = useState<boolean>(defaultQueries.showType);
  const [showScope, setShowScope] = useState<boolean>(defaultQueries.showScope);

  const [nameFilter, setNameFilter] = useState(new Set<number>());
  const [typeFilter, setTypeFilter] = useState(new Set<number>());
  const [scopeFilter, setScopeFilter] = useState(new Set<number>());

  const router = useRouter();
  const showTypeQuery = router.query[queryKeys.showType];
  const showScopeQuery = router.query[queryKeys.showScope];
  const typeQuery = router.query[queryKeys.partnerType];
  const scopeQuery = router.query[queryKeys.partnerScope];
  const nameIdsQuery = router.query[queryKeys.orgIds];

  useEffect(() => {
    if (!showTypeQuery) setShowType(defaultQueries.showType);
    if (showTypeQuery === "true") setShowType(true);
    if (showTypeQuery === "false") setShowType(false);
  }, [showTypeQuery]);

  useEffect(() => {
    if (!showScopeQuery) setShowScope(defaultQueries.showScope);
    if (showScopeQuery === "true") setShowScope(true);
    if (showScopeQuery === "false") setShowScope(false);
  }, [showScopeQuery]);

  useEffect(() => {
    setNameFilter(getIdsFromQueryParams(queryKeys.orgIds));
  }, [nameIdsQuery]);

  useEffect(() => {
    setTypeFilter(getIdsFromQueryParams(queryKeys.partnerType));
  }, [typeQuery]);

  useEffect(() => {
    setScopeFilter(getIdsFromQueryParams(queryKeys.partnerScope));
  }, [scopeQuery]);

  function refreshAndClearFilters() {
    clearQueries();
    refreshOrganizations();
  }

  const filteredOrganisation = useMemo(
    () =>
      allPartners
        .map((m) => ({ ...m, key: m.id, name: getName(m, en) }))
        .filter((m) =>
          filterFn(m, {
            nameFilter,
            typeFilter,
            scopeFilter,
          })
        ),
    [allPartners, typeFilter, scopeFilter, nameFilter, en]
  );

  type OrganizationColumnType = ColumnType<
    (typeof filteredOrganisation)[number]
  >;

  const nameColumn: OrganizationColumnType = useMemo(
    () => ({
      title: en ? "Name" : "Nom",
      dataIndex: "name",
      className: "name-column",
      sorter: nameSorter(en),
      render: (value, organization) => (
        <SafeLink href={PageRoutes.organizationProfile(organization.id)}>
          {value}
        </SafeLink>
      ),
    }),
    [en]
  );

  const typeColumn: OrganizationColumnType = useMemo(
    () => ({
      title: en ? "Organization Type" : "Type d'organisation",
      dataIndex: ["org_type", en ? "name_en" : "name_fr"],
      className: "type-column",
      sorter: en
        ? (a, b) =>
            (a.org_type?.name_en || "").localeCompare(b.org_type?.name_en || "")
        : (a, b) =>
            (a.org_type?.name_fr || "").localeCompare(
              b.org_type?.name_fr || ""
            ),
    }),
    [en]
  );

  const scopeColumn: OrganizationColumnType = useMemo(
    () => ({
      title: en ? "Organization Scope" : "Portée de l'organisation",
      dataIndex: ["org_scope", en ? "name_en" : "name_fr"],
      className: "scope-column",
      sorter: en
        ? (a, b) =>
            (a.org_scope?.name_en || "").localeCompare(
              b.org_scope?.name_en || ""
            )
        : (a, b) =>
            (a.org_scope?.name_fr || "").localeCompare(
              b.org_scope?.name_fr || ""
            ),
    }),
    [en]
  );

  const columns: OrganizationColumnType[] = [nameColumn];
  if (showType) columns.push(typeColumn);
  if (showScope) columns.push(scopeColumn);

  const filters = (
    <Form
      onFinish={blurActiveElement}
      className="filters"
      labelAlign="left"
      size="small"
    >
      <Form.Item
        label={en ? "Filter by name" : "Filtrer par nom"}
        htmlFor="name-filter"
      >
        <OrgNameFilter
          id="name-filter"
          value={nameFilter}
          onChange={handleNameFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>
      <Form.Item
        label={en ? "Filter by type" : "Filtrer par type"}
        htmlFor="type-filter"
      >
        <OrgTypeFilter
          id="type-filter"
          value={typeFilter}
          onChange={handlePartnerTypeFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>

      <Form.Item
        label={en ? "Filter by scope" : "Filtrer par portée"}
        htmlFor="scope-filter"
      >
        <OrgScopeFilter
          id="scope-filter"
          value={scopeFilter}
          onChange={handlePartnerScopeFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>
      <label htmlFor="show-column-checkboxes">
        {en ? "Show Columns:" : "Afficher les colonnes:"}
      </label>

      <span className="show-column-checkboxes" id="show-column-checkboxes">
        <Checkbox
          checked={showType}
          onChange={(e) => handleShowTypeChange(e.target.checked)}
        >
          {en ? "Show Organization Type" : "Afficher le type"}
        </Checkbox>

        <Checkbox
          checked={showScope}
          onChange={(e) => handleShowScopeChange(e.target.checked)}
        >
          {en
            ? "Show Organization Scope"
            : "Afficher la portée de l'organisation"}
        </Checkbox>
      </span>
    </Form>
  );

  const Header = () => (
    <>
      <div className="header-title-row">
        <Title level={1}>{en ? "All Partners" : "Tous les partenaires"}</Title>
        <Button type="primary" onClick={refreshAndClearFilters} size="large">
          {en ? "Reset the filter" : "Réinitialiser le filtre"}
        </Button>{" "}
        {localAccount && localAccount.is_admin && (
          <Button
            type="primary"
            size="large"
            onClick={() => handleRegisterPartner()}
          >
            {en ? "Add a new partner" : "Ajouter un nouveau partenaire"}
          </Button>
        )}
      </div>
      {filters}
    </>
  );

  const expandedRowRender = (organization: PartnerPublicInfo) => (
    <Descriptions size="small" layout="vertical" className="problems-container">
      <Item label={en ? "About" : "À propos"}>{organization.description}</Item>
    </Descriptions>
  );

  return (
    <Table
      className="all-partners-table"
      size="small"
      tableLayout="auto"
      columns={columns}
      dataSource={filteredOrganisation}
      loading={loading}
      title={Header}
      pagination={false}
      showSorterTooltip={false}
      sticky={{ offsetHeader: 74 }}
      scroll={{ x: true }}
      rowClassName={(_, index) =>
        "table-row " + (index % 2 === 0 ? "even" : "odd")
      }
      expandable={{
        expandedRowRender,
        expandedRowClassName: (_, index) =>
          "expanded-table-row " + (index % 2 === 0 ? "even" : "odd"),
        rowExpandable: (m) => !!m.description && m.description.length > 0,
      }}
    />
  );
};

export default AllPartners;
