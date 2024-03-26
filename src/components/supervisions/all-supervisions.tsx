// This is a component that displays a table of supervisions , with filters to filter the supervisions based on supervision trainee name, faculty and level
// The component also has buttons ta add a new supervision and clear the filters.
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
import GetLanguage from "../../utils/front-end/get-language";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import SafeLink from "../link/safe-link";
import Router, { useRouter } from "next/router";
import Form from "antd/lib/form";
import blurActiveElement from "../../utils/front-end/blur-active-element";
import { Checkbox } from "antd";
import type { SupervisionPublicInfo } from "../../services/_types";
import { AllSupervisionsCtx } from "../../services/context/all-supervisions-ctx";
import LevelFilter from "../filters/level-filter";
import FacultyFilter from "../filters/faculty-filter";
import SupervisionNameFilter from "../filters/supervision-name-filter";
import type { ParsedUrlQueryInput } from "querystring";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

function nameSorter(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name);
}

function getName(supervision: SupervisionPublicInfo) {
  return supervision.first_name + " " + supervision.last_name;
}

function filterFn(
  m: SupervisionPublicInfo & { name: string },
  filters: {
    nameFilter: Set<number>;
    facultyFilter: Set<number>;
    levelFilter: Set<number>;
  }
): boolean {
  const { nameFilter, facultyFilter, levelFilter } = filters;
  if (nameFilter.size > 0 && !nameFilter.has(m.id)) return false;
  if (facultyFilter.size > 0) {
    if (!m.faculty && !facultyFilter.has(0)) return false; // id 0 is for null
    if (m.faculty && !facultyFilter.has(m.faculty.id)) return false;
  }
  if (levelFilter.size > 0) {
    if (!m.level && !levelFilter.has(0)) return false; // id 0 is for null
    if (m.level && !levelFilter.has(m.level.id)) return false;
  }

  return true;
}

// Use query params for filters - for bookmarking, back button etc.
export const queryKeys = {
  memberIds: "memberIds",
  faculties: "faculties",
  levels: "levels",
  showFaculty: "showFaculty",
  showLevel: "showLevel",
  showKeywords: "showKeywords",
  showStartDate: "showStartDate",
  showEndDate: "showEndDate",
} as const;

// Don't want to change url if query is default value
const defaultQueries = {
  showFaculty: true,
  showLevel: true,
  showStartDate: true,
  showEndDate: false,
} as const;

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

function handleLevelFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.levels]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleShowFacultyChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showFaculty]: value,
  };
  if (value === defaultQueries.showFaculty) delete query[queryKeys.showFaculty];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowLevelChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showLevel]: value,
  };
  if (value === defaultQueries.showLevel) delete query[queryKeys.showLevel];
  Router.push({ query }, undefined, { scroll: false });
}
function handleShowStartDateChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showStartDate]: value,
  };
  if (value === defaultQueries.showStartDate)
    delete query[queryKeys.showStartDate];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowEndDateChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showEndDate]: value,
  };
  if (value === defaultQueries.showEndDate) delete query[queryKeys.showEndDate];
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
    document.querySelector(".all-supervisions-table .filters") || document.body
  );
}

const AllSupervisions: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();

  const {
    allSupervisions,
    loading,
    refresh: refreshSupervisions,
  } = useContext(AllSupervisionsCtx);

  const handleCreateEvent = () => {
    if (institute) {
      router.push({
        pathname: "/[instituteId]/supervisions/register",
        query: { instituteId: institute.urlIdentifier },
      });
    }
  };

  const { localAccount } = useContext(ActiveAccountCtx);

  useEffect(() => {
    refreshSupervisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showFaculty, setShowFaculty] = useState<boolean>(
    defaultQueries.showFaculty
  );

  const [showLevel, setShowLevel] = useState<boolean>(defaultQueries.showLevel);

  const [showStartDate, setShowStartDate] = useState<boolean>(
    defaultQueries.showStartDate
  );
  const [showEndDate, setShowEndDate] = useState<boolean>(
    defaultQueries.showEndDate
  );

  const [nameFilter, setNameFilter] = useState(new Set<number>());
  const [facultyFilter, setFacultyFilter] = useState(new Set<number>());
  const [levelFilter, setLevelFilter] = useState(new Set<number>());

  const router = useRouter();
  const memberIdsQuery = router.query[queryKeys.memberIds];
  const facultiesQuery = router.query[queryKeys.faculties];
  const levelsQuery = router.query[queryKeys.levels];
  const showFacultyQuery = router.query[queryKeys.showFaculty];
  const showLevelQuery = router.query[queryKeys.showLevel];
  const showStartDateQuery = router.query[queryKeys.showStartDate];
  const showEndDateQuery = router.query[queryKeys.showEndDate];

  useEffect(() => {
    setNameFilter(getIdsFromQueryParams(queryKeys.memberIds));
  }, [memberIdsQuery]);

  useEffect(() => {
    if (!showFacultyQuery) setShowFaculty(defaultQueries.showFaculty);
    if (showFacultyQuery === "true") setShowFaculty(true);
    if (showFacultyQuery === "false") setShowFaculty(false);
  }, [showFacultyQuery]);

  useEffect(() => {
    if (!showLevelQuery) setShowLevel(defaultQueries.showLevel);
    if (showLevelQuery === "true") setShowLevel(true);
    if (showLevelQuery === "false") setShowLevel(false);
  }, [showLevelQuery]);

  useEffect(() => {
    if (!showStartDateQuery) setShowStartDate(defaultQueries.showStartDate);
    if (showStartDateQuery === "true") setShowStartDate(true);
    if (showStartDateQuery === "false") setShowStartDate(false);
  }, [showStartDateQuery]);

  useEffect(() => {
    if (!showEndDateQuery) setShowEndDate(defaultQueries.showEndDate);
    if (showEndDateQuery === "true") setShowEndDate(true);
    if (showEndDateQuery === "false") setShowEndDate(false);
  }, [showEndDateQuery]);

  useEffect(() => {
    setNameFilter(getIdsFromQueryParams(queryKeys.memberIds));
  }, [memberIdsQuery]);

  useEffect(() => {
    setFacultyFilter(getIdsFromQueryParams(queryKeys.faculties));
  }, [facultiesQuery]);

  useEffect(() => {
    setLevelFilter(getIdsFromQueryParams(queryKeys.levels));
  }, [levelsQuery]);

  function refreshAndClearFilters() {
    clearQueries();
    refreshSupervisions();
  }
  const filteredSupervisions = useMemo(
    () =>
      allSupervisions
        .map((m) => ({
          ...m,
          key: m.id,
          supervision: getName(m),
          name: getName(m),
        }))
        .filter((m) =>
          filterFn(m, {
            nameFilter,
            facultyFilter,
            levelFilter,
          })
        ),
    [allSupervisions, facultyFilter, levelFilter, nameFilter]
  );

  type SupervisionColumnType = ColumnType<
    (typeof filteredSupervisions)[number]
  >;

  const nameColumn: SupervisionColumnType = useMemo(
    () => ({
      title: en ? "Name" : "Nom",
      dataIndex: "name",
      className: "name-column",
      //sorter: nameSorter,
      render: (value, member) => (
        <SafeLink href={PageRoutes.supervisionProfile(member.id)}>
          {value}
        </SafeLink>
      ),
    }),
    [en]
  );

  const facultyColumn: SupervisionColumnType = useMemo(
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

  const levelColumn: SupervisionColumnType = useMemo(
    () => ({
      title: en ? "Level" : "Niveau",
      dataIndex: ["level", en ? "name_en" : "name_fr"],
      className: "level-column",
      sorter: en
        ? (a, b) =>
            (a.level?.name_en || "").localeCompare(b.level?.name_en || "")
        : (a, b) =>
            (a.level?.name_fr || "").localeCompare(b.level?.name_fr || ""),
    }),
    [en]
  );

  const startDateColumn: SupervisionColumnType = useMemo(
    () => ({
      title: en ? "Start Date" : "Date de début",
      dataIndex: "start_date",
      className: "start-date-column",
      render: (value) => {
        const date = new Date(value);
        return date.toISOString().split("T")[0];
      },
    }),
    [en]
  );

  const endDateColumn: SupervisionColumnType = useMemo(
    () => ({
      title: en ? "End Date" : "Date de fin",
      dataIndex: "end_date",
      className: "end-date-column",
      render: (value) => {
        const date = new Date(value);
        return date.toISOString().split("T")[0];
      },
    }),
    [en]
  );

  const columns: SupervisionColumnType[] = [nameColumn];
  if (showFaculty) columns.push(facultyColumn);
  if (showLevel) columns.push(levelColumn);
  if (showStartDate) columns.push(startDateColumn);
  if (showEndDate) columns.push(endDateColumn);
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
        <SupervisionNameFilter
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
        label={en ? "Filter by level" : "Filtrer par niveau"}
        htmlFor="level-filter"
      >
        <LevelFilter
          id="level-filter"
          value={levelFilter}
          onChange={handleLevelFilterChange}
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
          checked={showStartDate}
          onChange={(e) => handleShowStartDateChange(e.target.checked)}
        >
          {en ? " Show Start Date" : "Afficher la date de début"}
        </Checkbox>

        <Checkbox
          checked={showEndDate}
          onChange={(e) => handleShowEndDateChange(e.target.checked)}
        >
          {en ? " Show End Date" : "Afficher la date de fin"}
        </Checkbox>
      </span>
    </Form>
  );

  const Header = () => (
    <>
      <div className="header-title-row">
        <Title level={1}>
          {en ? "All Supervisions" : "Toutes les supervisions"}
        </Title>
        <Button type="primary" onClick={refreshAndClearFilters} size="large">
          {en ? "Reset the filter" : "Réinitialiser le filtre"}
        </Button>{" "}
        {localAccount && localAccount.is_admin && (
          <Button
            type="primary"
            size="large"
            onClick={() => handleCreateEvent()}
          >
            {en ? "Add a new supervision" : "Ajouter une nouvelle supervision"}
          </Button>
        )}
      </div>
      {filters}
    </>
  );
  const expandedRowRender = (supervision: SupervisionPublicInfo) => (
    <Descriptions size="small" layout="vertical" className="problems-container">
      <Item
        label={en ? "About this supervision" : "À propos de cette supervision"}
      >
        {supervision.note}
      </Item>
    </Descriptions>
  );

  return (
    <Table
      className="all-supervisions-table"
      size="small"
      tableLayout="auto"
      columns={columns}
      dataSource={filteredSupervisions}
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
        rowExpandable: (m) => !!m.note && m.note.length > 0,
      }}
    />
  );
};

export default AllSupervisions;
