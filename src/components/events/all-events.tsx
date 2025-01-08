// This is a component that displays a table of events, with filters to filter the events based on name, type, start date and end date.
// The component also has buttons to create new events, refresh the events and clear the filters.
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
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import SafeLink from "../link/safe-link";
import Router, { useRouter } from "next/router";
import Form from "antd/lib/form";
import blurActiveElement from "../../utils/front-end/blur-active-element";
import { Checkbox } from "antd";
import type { ParsedUrlQueryInput } from "querystring";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { AllEventsCtx } from "../../services/context/all-events-ctx";
import EventNameFilter from "../filters/event-name-filter";
import EventTypeFilter from "../filters/event-type-filter";
import EventDateFilter from "../filters/event-date-filter";
import type { EventPublicInfo } from "../../services/_types";
import moment, { Moment } from "moment";
import type { RangeValue } from "rc-picker/lib/interface";
import {
  useAdminDetails,
  useSelectedInstitute,
} from "../../services/context/selected-institute-ctx";

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

function getName(event: EventPublicInfo, en: boolean) {
  return en ? event.name_en : event.name_fr;
}
function filterFn(
  m: EventPublicInfo,
  filters: {
    nameFilter: Set<number>;
    typeFilter: Set<number>;
    startDateFilter: moment.Moment | null;
    endDateFilter: moment.Moment | null;
  }
): boolean {
  const { nameFilter, typeFilter, startDateFilter, endDateFilter } = filters;

  if (nameFilter.size > 0 && !nameFilter.has(m.id)) return false;

  if (typeFilter.size > 0) {
    if (!m.event_type) return false;
    if (!typeFilter.has(m.event_type.id)) return false;
  }

  if (startDateFilter && m.start_date) {
    const eventStartDate = moment(m.start_date);
    if (eventStartDate.isBefore(startDateFilter, "day")) return false;
  }

  if (endDateFilter && m.end_date) {
    const eventEndDate = moment(m.end_date);
    if (eventEndDate.isAfter(endDateFilter, "day")) return false;
  }

  return true;
}

// Use query params for filters - for bookmarking, back button etc.
export const queryKeys = {
  eventIds: "eventIds",
  eventType: "eventType",
  eventStartDate: "eventStartDate",
  eventEndDate: "eventEndDate",
  showType: "showType",
  showStartDate: "showStartDate",
  showEndDate: "showEndDate",
} as const;

// Don't want to change url if query is default value
const defaultQueries = {
  showType: true,
  showStartDate: true,
  showEndDate: true,
} as const;

function handleEventNameFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.eventIds]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleEventTypeFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.eventType]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleEventDateFilterChange(value: RangeValue<Moment> | null) {
  const adjustedStartDate =
    value && value[0] ? value[0].clone().subtract(1, "day") : null;

  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.eventStartDate]: adjustedStartDate
          ? adjustedStartDate.format("YYYY-MM-DD")
          : null,
        [queryKeys.eventEndDate]: value ? value[1]?.format("YYYY-MM-DD") : null,
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleShowTypeChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showType]: value,
  };
  if (value === defaultQueries.showType) delete query[queryKeys.showType];
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

function clearQueries(institute: { urlIdentifier: string | null }) {
  if (institute?.urlIdentifier) {
    const url = PageRoutes.allEvents(institute.urlIdentifier);
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
  return (
    document.querySelector(".all-organizations-table .filters") || document.body
  );
}

const AllEvents: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();

  const {
    allEvents,
    loading,
    refresh: refreshEvents,
  } = useContext(AllEventsCtx);

  useEffect(() => {
    refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateEvent = () => {
    if (institute) {
      router.push({
        pathname: "/[instituteId]/events/register",
        query: { instituteId: institute.urlIdentifier },
      });
    }
  };

  const { localAccount } = useContext(ActiveAccountCtx);
  const isAdmin = useAdminDetails();

  const [showType, setShowType] = useState<boolean>(defaultQueries.showType);
  const [showStartDate, setShowStartDate] = useState<boolean>(
    defaultQueries.showStartDate
  );
  const [showEndDate, setShowEndDate] = useState<boolean>(
    defaultQueries.showEndDate
  );

  const [nameFilter, setNameFilter] = useState(new Set<number>());
  const [typeFilter, setTypeFilter] = useState(new Set<number>());
  const [startDateFilter, setStartDateFilter] = useState<moment.Moment | null>(
    null
  );
  const [endDateFilter, setEndDateFilter] = useState<moment.Moment | null>(
    null
  );

  const router = useRouter();
  const showTypeQuery = router.query[queryKeys.showType];
  const showStartDateQuery = router.query[queryKeys.showStartDate];
  const startDateQuery = router.query[queryKeys.eventStartDate];
  const endDateQuery = router.query[queryKeys.eventEndDate];

  const showEndDateQuery = router.query[queryKeys.showEndDate];
  const typeQuery = router.query[queryKeys.eventType];
  const nameIdsQuery = router.query[queryKeys.eventIds];

  useEffect(() => {
    if (!showTypeQuery) setShowType(defaultQueries.showType);
    if (showTypeQuery === "true") setShowType(true);
    if (showTypeQuery === "false") setShowType(false);
  }, [showTypeQuery]);

  useEffect(() => {
    if (!showStartDateQuery) setShowStartDate(defaultQueries.showStartDate);
    if (showStartDateQuery === "true") setShowStartDate(true);
    if (showStartDateQuery === "false") setShowStartDate(false);
  }, [showStartDateQuery]);

  useEffect(() => {
    if (!startDateQuery) setStartDateFilter(null);
    else setStartDateFilter(moment(startDateQuery));
  }, [startDateQuery]);
  useEffect(() => {
    if (!endDateQuery) setEndDateFilter(null);
    else setEndDateFilter(moment(endDateQuery));
  }, [endDateQuery]);

  useEffect(() => {
    if (!showEndDateQuery) setShowEndDate(defaultQueries.showEndDate);
    if (showEndDateQuery === "true") setShowEndDate(true);
    if (showEndDateQuery === "false") setShowEndDate(false);
  }, [showEndDateQuery]);

  useEffect(() => {
    setNameFilter(getIdsFromQueryParams(queryKeys.eventIds));
  }, [nameIdsQuery]);

  useEffect(() => {
    setTypeFilter(getIdsFromQueryParams(queryKeys.eventType));
  }, [typeQuery]);

  function refreshAndClearFilters() {
    const instituteUrlIdentifier = institute?.urlIdentifier; 
    if (instituteUrlIdentifier) {
      clearQueries({ urlIdentifier: instituteUrlIdentifier }); 
       refreshEvents();
    }else {
      console.error("Cannot reset filters: Institute ID is missing.");
    }
    
  }
  const filteredEvents = useMemo(
    () =>
      allEvents
        .map((m) => ({ ...m, key: m.id, name: getName(m, en) }))
        .filter((m) =>
          filterFn(m, {
            nameFilter,
            typeFilter,
            startDateFilter,
            endDateFilter,
          })
        ),
    [allEvents, nameFilter, typeFilter, startDateFilter, endDateFilter, en]
  );

  type EventColumnType = ColumnType<(typeof filteredEvents)[number]>;

  const nameColumn: EventColumnType = useMemo(
    () => ({
      title: en ? "Name" : "Nom",
      dataIndex: ["name_en", "name_fr"],
      className: "name-column",
      sorter: nameSorter(en),
      render: (value, event) => (
        <SafeLink href={PageRoutes.eventProfile(event.id)}>
          {event.name_en || event.name_fr}
        </SafeLink>
      ),
    }),
    [en]
  );

  const typeColumn: EventColumnType = useMemo(
    () => ({
      title: en ? "Event Type" : "Type d'événement",
      dataIndex: ["event_type", en ? "name_en" : "name_fr"],
      className: "type-column",
      sorter: en
        ? (a, b) =>
            (a.event_type?.name_en || "").localeCompare(
              b.event_type?.name_en || ""
            )
        : (a, b) =>
            (a.event_type?.name_fr || "").localeCompare(
              b.event_type?.name_fr || ""
            ),
    }),
    [en]
  );

  const startDateColumn: EventColumnType = useMemo(
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

  const endDateColumn: EventColumnType = useMemo(
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

  const columns: EventColumnType[] = [nameColumn];
  if (showType) columns.push(typeColumn);
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
        label={en ? "Filter by event name" : "Filtrer par nom d'événement"}
        htmlFor="event-name-filter"
      >
        <EventNameFilter
          id="event-name-filter"
          value={nameFilter}
          onChange={handleEventNameFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>
      <Form.Item
        label={en ? "Filter by event type" : "Filtrer par type d'événement"}
        htmlFor="event-type-filter"
      >
        <EventTypeFilter
          id="event-type-filter"
          value={typeFilter}
          onChange={handleEventTypeFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>

      <Form.Item
        label={en ? "Filter by date" : "Filtrer par date"}
        htmlFor="event-date-filter"
      >
        <EventDateFilter
          id="event-date-filter"
          getPopupContainer={getPopupContainer}
          onChange={handleEventDateFilterChange}
        />
      </Form.Item>

      <label htmlFor="show-column-checkboxes">
        {en ? " Show Columns:" : "Afficher les colonnes:"}
      </label>

      <span className="show-column-checkboxes" id="show-column-checkboxes">
        <Checkbox
          checked={showType}
          onChange={(e) => handleShowTypeChange(e.target.checked)}
        >
          {en ? " Show Type" : "Afficher le type"}
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
        <Title level={1}>{en ? "All Events" : "Tous les événements"}</Title>
        <Button type="primary" onClick={refreshAndClearFilters} size="large">
          {en ? "Reset the filter" : "Réinitialiser le filtre"}
        </Button>{" "}
        {localAccount && isAdmin && (
          <Button
            type="primary"
            size="large"
            onClick={() => handleCreateEvent()}
          >
            {en ? "Add a new event" : "Ajouter un nouvel événement"}
          </Button>
        )}
      </div>
      {filters}
    </>
  );

  const expandedRowRender = (event: EventPublicInfo) => (
    <Descriptions size="small" layout="vertical" className="problems-container">
      <Item label={en ? "About this event" : "À propos de cet événement"}>
        {event.note}
      </Item>
    </Descriptions>
  );

  return (
    <Table
      className="all-grants-table"
      size="small"
      tableLayout="auto"
      columns={columns}
      dataSource={filteredEvents}
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

export default AllEvents;
