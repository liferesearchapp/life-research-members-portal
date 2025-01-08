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
import KeywordTag from "../keywords/keyword-tag";
import { AllMembersCtx } from "../../services/context/all-members-ctx";
import GetLanguage from "../../utils/front-end/get-language";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import SafeLink from "../link/safe-link";
import Router, { useRouter } from "next/router";
import Form from "antd/lib/form";
import type { keyword } from "@prisma/client";
import KeywordFilter from "../filters/keyword-filter";
import blurActiveElement from "../../utils/front-end/blur-active-element";
import { Checkbox } from "antd";
import type { MemberPublicInfo } from "../../services/_types";
import MemberTypeFilter from "../filters/member-type-filter";
import FacultyFilter from "../filters/faculty-filter";
import MemberNameFilter from "../filters/member-name-filter";
import { AllKeywordsCtx } from "../../services/context/all-keywords-ctx";
import type { ParsedUrlQueryInput } from "querystring";
import {
  useAdminDetails,
  useSelectedInstitute,
} from "../../services/context/selected-institute-ctx";

function nameSorter(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name);
}

function getName(member: MemberPublicInfo) {
  return member.account.first_name + " " + member.account.last_name;
}

function filterFn(
  m: MemberPublicInfo & { name: string },
  filters: {
    nameFilter: Set<number>;
    facultyFilter: Set<number>;
    memberTypeFilter: Set<number>;
    keywordFilter: Set<number>;
  }
): boolean {
  const { nameFilter, facultyFilter, memberTypeFilter, keywordFilter } =
    filters;
  if (nameFilter.size > 0 && !nameFilter.has(m.id)) return false;
  if (facultyFilter.size > 0) {
    if (!m.faculty && !facultyFilter.has(0)) return false; // id 0 is for null
    if (m.faculty && !facultyFilter.has(m.faculty.id)) return false;
  }
  if (memberTypeFilter.size > 0) {
    if (!m.member_type && !memberTypeFilter.has(0)) return false; // id 0 is for null
    if (m.member_type && !memberTypeFilter.has(m.member_type.id)) return false;
  }
  if (keywordFilter.size > 0) {
    if (!m.has_keyword.some(({ keyword }) => keywordFilter.has(keyword.id)))
      return false;
  }
  return true;
}

// Use query params for filters - for bookmarking, back button etc.
export const queryKeys = {
  showFaculty: "showFaculty",
  showMemberType: "showMemberType",
  showKeywords: "showKeywords",
  memberIds: "memberIds",
  faculties: "faculties",
  memberTypes: "memberTypes",
  keywords: "keywords",
} as const;

// Don't want to change url if query is default value
const defaultQueries = {
  showFaculty: false,
  showMemberType: false,
  showKeywords: true,
} as const;

function handleShowFacultyChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showFaculty]: value,
  };
  if (value === defaultQueries.showFaculty) delete query[queryKeys.showFaculty];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowMemberTypeChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showMemberType]: value,
  };
  if (value === defaultQueries.showMemberType)
    delete query[queryKeys.showMemberType];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowKeywordsChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showKeywords]: value,
  };
  if (value === defaultQueries.showKeywords)
    delete query[queryKeys.showKeywords];
  Router.push({ query }, undefined, { scroll: false });
}

function handleNameFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.memberIds]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleFacultyFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.faculties]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleMemberTypeFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.memberTypes]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleKeywordFilterChange(next: Set<number>) {
  Router.push(
    {
      query: { ...Router.query, [queryKeys.keywords]: Array.from(next.keys()) },
    },
    undefined,
    { scroll: false }
  );
}

function clearQueries(institute: { urlIdentifier: string | null }) {
  if (institute?.urlIdentifier) {
    const url = PageRoutes.allMembers(institute.urlIdentifier);
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
  return document.querySelector(".all-members-table .filters") || document.body;
}

const AllMembers: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();
  
  const {
    allMembers,
    loading,
    refresh: refreshMembers,
  } = useContext(AllMembersCtx);

  const { refresh: refreshKeywords } = useContext(AllKeywordsCtx);

  useEffect(() => {
    refreshMembers();
    refreshKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showFaculty, setShowFaculty] = useState<boolean>(
    defaultQueries.showFaculty
  );
  const [showMemberType, setShowMemberType] = useState<boolean>(
    defaultQueries.showMemberType
  );
  const [showKeywords, setShowKeywords] = useState<boolean>(
    defaultQueries.showKeywords
  );

  const [nameFilter, setNameFilter] = useState(new Set<number>());
  const [facultyFilter, setFacultyFilter] = useState(new Set<number>());
  const [memberTypeFilter, setMemberTypeFilter] = useState(new Set<number>());
  const [keywordFilter, setKeywordFilter] = useState(new Set<number>());

  const router = useRouter();
  const showFacultyQuery = router.query[queryKeys.showFaculty];
  const showMemberTypeQuery = router.query[queryKeys.showMemberType];
  const showKeywordsQuery = router.query[queryKeys.showKeywords];
  const memberIdsQuery = router.query[queryKeys.memberIds];
  const facultiesQuery = router.query[queryKeys.faculties];
  const memberTypesQuery = router.query[queryKeys.memberTypes];
  const keywordsQuery = router.query[queryKeys.keywords];

  useEffect(() => {
    if (!showFacultyQuery) setShowFaculty(defaultQueries.showFaculty);
    if (showFacultyQuery === "true") setShowFaculty(true);
    if (showFacultyQuery === "false") setShowFaculty(false);
  }, [showFacultyQuery]);

  useEffect(() => {
    if (!showMemberTypeQuery) setShowMemberType(defaultQueries.showMemberType);
    if (showMemberTypeQuery === "true") setShowMemberType(true);
    if (showMemberTypeQuery === "false") setShowMemberType(false);
  }, [showMemberTypeQuery]);

  useEffect(() => {
    if (!showKeywordsQuery) setShowKeywords(defaultQueries.showKeywords);
    if (showKeywordsQuery === "true") setShowKeywords(true);
    if (showKeywordsQuery === "false") setShowKeywords(false);
  }, [showKeywordsQuery]);

  useEffect(() => {
    setNameFilter(getIdsFromQueryParams(queryKeys.memberIds));
  }, [memberIdsQuery]);

  useEffect(() => {
    setFacultyFilter(getIdsFromQueryParams(queryKeys.faculties));
  }, [facultiesQuery]);

  useEffect(() => {
    setMemberTypeFilter(getIdsFromQueryParams(queryKeys.memberTypes));
  }, [memberTypesQuery]);

  useEffect(() => {
    setKeywordFilter(getIdsFromQueryParams(queryKeys.keywords));
  }, [keywordsQuery]);

  function refreshAndClearFilters() {
    const instituteUrlIdentifier = institute?.urlIdentifier; // Retrieve urlIdentifier instead of id
    if (instituteUrlIdentifier) {
      clearQueries({ urlIdentifier: instituteUrlIdentifier }); // Pass as an object
    refreshMembers();}
    else {
      console.error("Cannot reset filters: Institute ID is missing.");
    }
    refreshKeywords();
  }

  const addKeyword = useCallback(
    (k: keyword) => {
      handleKeywordFilterChange(new Set(keywordFilter).add(k.id));
    },
    [keywordFilter]
  );

  const filteredMembers = useMemo(
    () =>
      allMembers
        .map((m) => ({ ...m, key: m.id, name: getName(m) }))
        .filter((m) =>
          filterFn(m, {
            nameFilter,
            facultyFilter,
            memberTypeFilter,
            keywordFilter,
          })
        ),
    [allMembers, facultyFilter, keywordFilter, memberTypeFilter, nameFilter]
  );

  type MemberColumnType = ColumnType<(typeof filteredMembers)[number]>;

  const nameColumn: MemberColumnType = useMemo(
    () => ({
      title: en ? "Name" : "Nom",
      dataIndex: "name",
      className: "name-column",
      sorter: nameSorter,
      render: (value, member) => (
        <SafeLink href={PageRoutes.memberProfile(member.id)}>{value}</SafeLink>
      ),
    }),
    [en]
  );

  const facultyColumn: MemberColumnType = useMemo(
    () => ({
      title: en ? "Faculty" : "Faculté",
      dataIndex: ["faculty", en ? "name_en" : "name_fr"],
      className: "faculty-column",
      sorter: en
        ? (a, b) =>
            (a.faculty?.name_en || "").localeCompare(b.faculty?.name_en || "")
        : (a, b) =>
            (a.faculty?.name_fr || "").localeCompare(b.faculty?.name_fr || ""),
    }),
    [en]
  );

  const memberTypeColumn: MemberColumnType = useMemo(
    () => ({
      title: en ? "Member Type" : "Type de membre",
      dataIndex: ["member_type", en ? "name_en" : "name_fr"],
      className: "type-column",
      sorter: en
        ? (a, b) =>
            (a.member_type?.name_en || "").localeCompare(
              b.member_type?.name_en || ""
            )
        : (a, b) =>
            (a.member_type?.name_fr || "").localeCompare(
              b.member_type?.name_fr || ""
            ),
    }),
    [en]
  );

  const keywordsColumn: MemberColumnType = useMemo(
    () => ({
      title: en ? "Keywords" : "Mots-clés",
      dataIndex: "has_keyword",
      className: "tag-column",
      render: (_, member) =>
        member.has_keyword.map((k) => (
          <KeywordTag
            key={k.keyword.id}
            keyword={k.keyword}
            onClick={addKeyword}
          />
        )),
    }),
    [addKeyword, en]
  );

  const columns: MemberColumnType[] = [nameColumn];
  if (showFaculty) columns.push(facultyColumn);
  if (showMemberType) columns.push(memberTypeColumn);
  if (showKeywords) columns.push(keywordsColumn);

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
        <MemberNameFilter
          id="name-filter"
          value={nameFilter}
          onChange={handleNameFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>
      <Form.Item
        label={en ? "Filter by faculty" : "Filtrer par faculté"}
        htmlFor="faculty-filter"
      >
        <FacultyFilter
          id="faculty-filter"
          value={facultyFilter}
          onChange={handleFacultyFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>
      <Form.Item
        label={en ? "Filter by type" : "Filtrer par type"}
        htmlFor="member-type-filter"
      >
        <MemberTypeFilter
          id="member-type-filter"
          value={memberTypeFilter}
          onChange={handleMemberTypeFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>
      <Form.Item
        label={en ? "Filter by keywords" : "Filtrer par mots-clés"}
        htmlFor="keyword-filter"
      >
        <KeywordFilter
          id="keyword-filter"
          value={keywordFilter}
          onChange={handleKeywordFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>
      <label htmlFor="show-column-checkboxes">
        {en ? "Show Columns:" : "Afficher les colonnes:"}
      </label>
      <span className="show-column-checkboxes" id="show-column-checkboxes">
        <Checkbox
          checked={showFaculty}
          onChange={(e) => handleShowFacultyChange(e.target.checked)}
        >
          {en ? "Show Faculty" : "Afficher la faculté"}
        </Checkbox>
        <Checkbox
          checked={showMemberType}
          onChange={(e) => handleShowMemberTypeChange(e.target.checked)}
        >
          {en ? "Show Member Type" : "Afficher le type de membre"}
        </Checkbox>
        <Checkbox
          checked={showKeywords}
          onChange={(e) => handleShowKeywordsChange(e.target.checked)}
        >
          {en ? "Show Keywords" : "Afficher les mots-clés"}
        </Checkbox>
      </span>
    </Form>
  );

  const Header = () => (
    <>
      <div className="header-title-row">
        <Title level={1}>{en ? "All Members" : "Tous les membres"}</Title>
        <Button type="primary" onClick={refreshAndClearFilters} size="large">
          {en ? "Reset" : "Réinitialiser"}
        </Button>
      </div>
      {filters}
    </>
  );

  const expandedRowRender = (member: MemberPublicInfo) => (
    <Descriptions size="small" layout="vertical" className="problems-container">
      <Item
        label={
          en ? "Problems I Work On" : "Problèmes sur lesquels je travaille"
        }
      >
        {member.problem.map((p, i) => (
          <Fragment key={i}>
            {`${i + 1}. `}
            <GetLanguage obj={p} />
            <br />
          </Fragment>
        ))}
      </Item>
    </Descriptions>
  );

  return (
    <Table
      className="all-members-table"
      size="small"
      tableLayout="auto"
      columns={columns}
      dataSource={filteredMembers}
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
        rowExpandable: (m) => m.problem.length > 0,
      }}
    />
  );
};

export default AllMembers;
