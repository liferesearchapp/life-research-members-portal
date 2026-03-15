// This is a component that displays a table of grants, with filters to filter the grants based on name, status and source
// The component also has buttons to add a new grant when login in as an administrator and clear the filters.
// The component also updates the URL query parameters based on the filter values and the query parameters are used to update the filters on component mount.

import Button from "antd/lib/button";
import Table, { ColumnType } from "antd/lib/table";
import Title from "antd/lib/typography/Title";
import {
  type FC,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import PageRoutes from "../../routing/page-routes";
import SafeLink from "../link/safe-link";
import Router, { useRouter } from "next/router";
import Form from "antd/lib/form";
import blurActiveElement from "../../utils/front-end/blur-active-element";
import { Checkbox } from "antd";
import type { ParsedUrlQueryInput } from "querystring";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import GrantNameFilter from "../filters/grant-name-filter";
import GrantStatusFilter from "../filters/grant-status-filter";
import GrantSourceFilter from "../filters/grant-source-filter";
import { AllGrantsCtx } from "../../services/context/all-grants-ctx";
import type { GrantPublicInfo } from "../../services/_types";
import getMemberInvolved from "../getters/grant-member-involved-getter";
import getInvestigatorMember from "../getters/grant-investigator-member-getter";
import {
  useAdminDetails,
  useSelectedInstitute,
} from "../../services/context/selected-institute-ctx";

function nameSorter(a: { title: string }, b: { title: string }) {
  return a.title.localeCompare(b.title);
}
function getTitle(grant: GrantPublicInfo) {
  return grant.title;
}

function filterFn(
  m: GrantPublicInfo & { grant: string },
  filters: {
    nameFilter: Set<number>;
    statusFilter: Set<number>;
    sourceFilter: Set<number>;
  }
): boolean {
  const { nameFilter, statusFilter, sourceFilter } = filters;
  if (nameFilter.size > 0 && !nameFilter.has(m.id)) return false;

  if (statusFilter.size > 0) {
    if (!m.status && !statusFilter.has(0)) return false; // id 0 is for null
    if (m.status && !statusFilter.has(m.status.id)) return false;
  }
  if (sourceFilter.size > 0) {
    if (!m.source && !sourceFilter.has(0)) return false; // id 0 is for null
    if (m.source && !sourceFilter.has(m.source.id)) return false;
  }

  return true;
}

// Use query params for filters - for bookmarking, back button etc.
export const queryKeys = {
  grantIds: "grantIds",
  grantStatus: "grantStatus",
  grantSource: "grantSource",
  showStatus: "showStatus",
  showSource: "showSource",
  showAmount: "showAmount",
  showSubmissionDate: "showSubmissionDate",
  showMemberinvolved: "showMemberinvolved",
  showInvestigatorMember: "showInvestigatorMember",
} as const;

// Don't want to change url if query is default value
const defaultQueries = {
  showStatus: true,
  showSource: true,
  showAmount: true,
  showSubmissionDate: false,
  showMemberinvolved: false,
  showInvestigatorMember: false,
} as const;

function handleGrantNameFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.grantIds]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleGrantStatusFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.grantStatus]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleGrantSourceFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.grantSource]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleShowStatusChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showStatus]: value,
  };
  if (value === defaultQueries.showStatus) delete query[queryKeys.showStatus];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowSourceChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showSource]: value,
  };
  if (value === defaultQueries.showSource) delete query[queryKeys.showSource];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowAmountChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showAmount]: value,
  };
  if (value === defaultQueries.showAmount) delete query[queryKeys.showAmount];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowSubmissionDateChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showSubmissionDate]: value,
  };
  if (value === defaultQueries.showSubmissionDate)
    delete query[queryKeys.showSubmissionDate];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowMemberInvolvedChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showMemberinvolved]: value,
  };
  if (value === defaultQueries.showMemberinvolved)
    delete query[queryKeys.showMemberinvolved];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowInvestigatorMemberChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showInvestigatorMember]: value,
  };
  if (value === defaultQueries.showInvestigatorMember)
    delete query[queryKeys.showInvestigatorMember];
  Router.push({ query }, undefined, { scroll: false });
}

function clearQueries(institute: { urlIdentifier: string | null }) {
  if (institute?.urlIdentifier) {
    const url = PageRoutes.allGrants(institute.urlIdentifier);
    console.log("Redirecting to:", url); 
    Router.push(url); 
  } else {
    console.error("Unable to reset filters: Institute ID is missing.");
    alert("Unable to reset filters: Institute ID is missing.");
  }
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
  return document.querySelector(".all-grants-table .filters") || document.body;
}

const AllGrants: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();

  const {
    allGrants,
    loading,
    refresh: refreshGrants,
  } = useContext(AllGrantsCtx);

  const { localAccount } = useContext(ActiveAccountCtx);
  const isAdmin = useAdminDetails();

  const handleCreateGrant = () => {
    if (institute) {
      router.push({
        pathname: "/[instituteId]/grants/register",
        query: { instituteId: institute.urlIdentifier },
      });
    }
  };

  useEffect(() => {
    refreshGrants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showStatus, setShowStatus] = useState<boolean>(
    defaultQueries.showStatus
  );
  const [showSource, setShowSource] = useState<boolean>(
    defaultQueries.showSource
  );
  const [showAmount, setShowAmount] = useState<boolean>(
    defaultQueries.showAmount
  );
  const [showSubmissionDate, setShowSubmissionDate] = useState<boolean>(
    defaultQueries.showSubmissionDate
  );
  const [showMemberInvolved, setShowMemberInvolved] = useState<boolean>(
    defaultQueries.showMemberinvolved
  );
  const [showInvestigatorMember, setShowInvestigatorMember] = useState<boolean>(
    defaultQueries.showInvestigatorMember
  );

  const [nameFilter, setNameFilter] = useState(new Set<number>());
  const [statusFilter, setStatusFilter] = useState(new Set<number>());
  const [sourceFilter, setSourceFilter] = useState(new Set<number>());

  const router = useRouter();
  const showStatusQuery = router.query[queryKeys.showStatus];
  const showSourceQuery = router.query[queryKeys.showSource];
  const showAmountQuery = router.query[queryKeys.showAmount];
  const showSubmissionDateQuery = router.query[queryKeys.showSubmissionDate];
  const showMemberInvolvedQuery = router.query[queryKeys.showMemberinvolved];
  const showInvestigatorMemberQuery =
    router.query[queryKeys.showInvestigatorMember];
  const grantIdsQuery = router.query[queryKeys.grantIds];
  const statusQuery = router.query[queryKeys.grantStatus];
  const sourceQuery = router.query[queryKeys.grantSource];

  useEffect(() => {
    if (!showStatusQuery) setShowStatus(defaultQueries.showStatus);
    if (showStatusQuery === "true") setShowStatus(true);
    if (showStatusQuery === "false") setShowStatus(false);
  }, [showStatusQuery]);

  useEffect(() => {
    if (!showSourceQuery) setShowSource(defaultQueries.showSource);
    if (showSourceQuery === "true") setShowSource(true);
    if (showSourceQuery === "false") setShowSource(false);
  }, [showSourceQuery]);

  useEffect(() => {
    if (!showAmountQuery) setShowAmount(defaultQueries.showAmount);
    if (showAmountQuery === "true") setShowAmount(true);
    if (showAmountQuery === "false") setShowAmount(false);
  }, [showAmountQuery]);

  useEffect(() => {
    if (!showSubmissionDateQuery)
      setShowSubmissionDate(defaultQueries.showSubmissionDate);
    if (showSubmissionDateQuery === "true") setShowSubmissionDate(true);
    if (showSubmissionDateQuery === "false") setShowSubmissionDate(false);
  }, [showSubmissionDateQuery]);

  useEffect(() => {
    if (!showMemberInvolvedQuery)
      setShowMemberInvolved(defaultQueries.showMemberinvolved);
    if (showMemberInvolvedQuery === "true") setShowMemberInvolved(true);
    if (showMemberInvolvedQuery === "false") setShowMemberInvolved(false);
  }, [showMemberInvolvedQuery]);

  useEffect(() => {
    if (!showInvestigatorMemberQuery)
      setShowInvestigatorMember(defaultQueries.showInvestigatorMember);
    if (showInvestigatorMemberQuery === "true") setShowInvestigatorMember(true);
    if (showInvestigatorMemberQuery === "false")
      setShowInvestigatorMember(false);
  }, [showInvestigatorMemberQuery]);

  useEffect(() => {
    setNameFilter(getIdsFromQueryParams(queryKeys.grantIds));
  }, [grantIdsQuery]);

  useEffect(() => {
    setStatusFilter(getIdsFromQueryParams(queryKeys.grantStatus));
  }, [statusQuery]);

  useEffect(() => {
    setSourceFilter(getIdsFromQueryParams(queryKeys.grantSource));
  }, [sourceQuery]);

  function refreshAndClearFilters() {
    const instituteUrlIdentifier = institute?.urlIdentifier; 
    if (instituteUrlIdentifier) {
      clearQueries({ urlIdentifier: instituteUrlIdentifier }); 
       refreshGrants();
    }else {
      console.error("Cannot reset filters: Institute ID is missing.");
    }
  }

  const filteredGrants = useMemo(
    () =>
      allGrants
        .map((m) => ({ ...m, key: m.id, grant: getTitle(m) }))
        .filter((m) =>
          filterFn(m, {
            nameFilter,
            statusFilter,
            sourceFilter,
          })
        ),
    [allGrants, statusFilter, sourceFilter, nameFilter]
  );

  type GrantColumnType = ColumnType<(typeof filteredGrants)[number]>;

  const nameColumn: GrantColumnType = useMemo(
    () => ({
      title: en ? "Title" : "Titre",
      dataIndex: "grant",
      className: "title-column",
      sorter: nameSorter,
      render: (value, grant) => (
        <SafeLink href={PageRoutes.grantProfile(grant.id)}>{value}</SafeLink>
      ),
    }),
    [en]
  );

  const statusColumn: GrantColumnType = useMemo(
    () => ({
      title: en ? "Status" : "Statut",
      dataIndex: ["status", en ? "name_en" : "name_fr"],
      className: "source-column",
      sorter: en
        ? (a, b) =>
            (a.status?.name_en || "").localeCompare(b.status?.name_en || "")
        : (a, b) =>
            (a.status?.name_fr || "").localeCompare(b.status?.name_fr || ""),
    }),
    [en]
  );

  const sourceColumn: GrantColumnType = useMemo(
    () => ({
      title: "Source",
      dataIndex: ["source", en ? "name_en" : "name_fr"],
      className: "source-column",
      sorter: en
        ? (a, b) =>
            (a.source?.name_en || "").localeCompare(b.source?.name_en || "")
        : (a, b) =>
            (a.source?.name_fr || "").localeCompare(b.source?.name_fr || ""),
    }),
    [en]
  );

  const amountColumn: GrantColumnType = useMemo(
    () => ({
      title: en ? "Amount" : "Montant",
      dataIndex: "amount",
      className: "amount-column",
      render: (value) => `$ ${value?.toLocaleString()}`,
    }),
    [en]
  );

  const submissionDateColumn: GrantColumnType = useMemo(
    () => ({
      title: en ? "Submission Date" : "Date de soumission",
      dataIndex: "submission_date",
      className: "submission-date-column",
      render: (value) => {
        const date = new Date(value);
        return date.toISOString().split("T")[0];
      },
    }),
    [en]
  );

  const memberInvolvedColumn: GrantColumnType = useMemo(() => {
    return {
      title: en ? "Members Involved" : "Membres impliqués",
      dataIndex: "grant_member_involved",
      key: "grant_member_involved",
      render: (
        grant_member_involved: Array<{
          member: {
            id: number;
            account: { first_name: string; last_name: string };
          };
        }>
      ) => {
        return <div>{getMemberInvolved(grant_member_involved)}</div>;
      },
    };
  }, [en]);

  const investigatorMemberColumn: GrantColumnType = useMemo(() => {
    return {
      title: en ? "Investigator Members" : "Membres chercheurs",
      dataIndex: "grant_investigator_member",
      key: "grant_investigator_member",
      render: (
        grant_investigator_member: Array<{
          member: {
            id: number;
            account: { first_name: string; last_name: string };
          };
        }>
      ) => {
        return <div>{getInvestigatorMember(grant_investigator_member)}</div>;
      },
    };
  }, [en]);

  const columns: GrantColumnType[] = [nameColumn];
  if (showSource) columns.push(sourceColumn);
  if (showStatus) columns.push(statusColumn);

  if (showAmount) columns.push(amountColumn);
  if (showSubmissionDate) columns.push(submissionDateColumn);
  if (showMemberInvolved) columns.push(memberInvolvedColumn);
  if (showInvestigatorMember) columns.push(investigatorMemberColumn);

  const filters = (
    <Form
      onFinish={blurActiveElement}
      className="filters"
      labelAlign="left"
      size="small"
    >
      <Form.Item
        label={en ? "Filter by grant name" : "Filtrer par nom de subvention"}
        htmlFor="grant-name-filter"
      >
        <GrantNameFilter
          id="grant-name-filter"
          value={nameFilter}
          onChange={handleGrantNameFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>
      <Form.Item
        label={
          en ? "Filter by grant status" : "Filtrer par statut de subvention"
        }
        htmlFor="grant-status-filter"
      >
        <GrantStatusFilter
          id="grant-status-filter"
          value={statusFilter}
          onChange={handleGrantStatusFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>

      <Form.Item
        label={
          en ? "Filter by grant source" : "Filtrer par source de subvention"
        }
        htmlFor="grant-source-filter"
      >
        <GrantSourceFilter
          id="grant-source-filter"
          value={sourceFilter}
          onChange={handleGrantSourceFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>
      <label htmlFor="show-column-checkboxes">
        {en ? " Show Columns:" : " Afficher les colonnes:"}
      </label>

      <span className="show-column-checkboxes" id="show-column-checkboxes">
        <Checkbox
          checked={showSource}
          onChange={(e) => handleShowSourceChange(e.target.checked)}
        >
          {en ? " Show Source" : " Afficher la source"}
        </Checkbox>

        <Checkbox
          checked={showStatus}
          onChange={(e) => handleShowStatusChange(e.target.checked)}
        >
          {en ? " Show Status" : " Afficher le statut"}
        </Checkbox>

        <Checkbox
          checked={showAmount}
          onChange={(e) => handleShowAmountChange(e.target.checked)}
        >
          {en ? " Show Amount" : " Afficher le montant"}
        </Checkbox>

        <Checkbox
          checked={showSubmissionDate}
          onChange={(e) => handleShowSubmissionDateChange(e.target.checked)}
        >
          {en ? " Show Submission Date" : " Afficher la date de soumission"}
        </Checkbox>

        <Checkbox
          checked={showMemberInvolved}
          onChange={(e) => handleShowMemberInvolvedChange(e.target.checked)}
        >
          {en ? " Show Members Involved" : " Afficher les membres impliqués"}
        </Checkbox>

        <Checkbox
          checked={showInvestigatorMember}
          onChange={(e) => handleShowInvestigatorMemberChange(e.target.checked)}
        >
          {en
            ? " Show Investigator Members"
            : " Afficher les membres investigateurs"}
        </Checkbox>
      </span>
    </Form>
  );

  const Header = () => (
    <>
      <div className="header-title-row">
        <Title level={1}>{en ? "All Grants" : "Toutes les subventions"}</Title>
        <Button type="primary" onClick={refreshAndClearFilters} size="large">
          {en ? "Reset the filter" : "Réinitialiser le filtre"}
        </Button>{" "}
        {localAccount && isAdmin && (
          <Button
            type="primary"
            size="large"
            onClick={() => handleCreateGrant()}
          >
            {en ? "Add a new grant" : "Ajouter une nouvelle subvention"}
          </Button>
        )}
      </div>
      {filters}
    </>
  );

  return (
    <Table
      className="all-grants-table"
      size="small"
      tableLayout="auto"
      columns={columns}
      dataSource={filteredGrants}
      loading={loading}
      title={Header}
      pagination={false}
      showSorterTooltip={false}
      sticky={{ offsetHeader: 74 }}
      scroll={{ x: true }}
      rowClassName={(_, index) =>
        "table-row " + (index % 2 === 0 ? "even" : "odd")
      }
    />
  );
};

export default AllGrants;
