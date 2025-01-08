// This is a functional component that allows the user to filter events by date range
// The component is connected to the AllEventsCtx to retrieve a list of all events
// The component includes an Ant Design DatePicker.RangePicker component to select a date range
// The filtered events can be passed to a callback function (onChange) with the selected date range and the filtered events as arguments
// The component stores the selected date range in its state (dateRange)
// The component can receive additional props, such as an ID and a getPopupContainer function, to customize the DatePicker component

import { type FC, useContext, useState } from "react";
import { AllEventsCtx } from "../../services/context/all-events-ctx";
import type { EventPublicInfo } from "../../services/_types";
import moment, { Moment } from "moment";
import { DatePicker } from "antd";
import type { RangePickerProps } from "antd/lib/date-picker";
import type { RangeValue } from "rc-picker/lib/interface";

type Props = {
  id?: string;
  onChange?: (
    value: RangeValue<Moment>,
    filteredEvents: EventPublicInfo[]
  ) => void;
  getPopupContainer?: RangePickerProps["getPopupContainer"];
};

const EventDateFilter: FC<Props> = ({
  id,
  onChange = () => {},
  getPopupContainer,
}) => {
  const { allEvents } = useContext(AllEventsCtx);
  const [dateRange, setDateRange] = useState<RangeValue<Moment>>([null, null]);

  function onDateChange(values: RangeValue<Moment>, _: [string, string]) {
    if (!values || values[0] === null || values[1] === null) {
      onChange(null, allEvents);
      setDateRange([null, null]);
      return;
    }

    const filteredEvents = allEvents.filter((event) => {
      if (!event.start_date) return false;
      const startDate = moment(event.start_date);
      const endDate = event.end_date ? moment(event.end_date) : startDate;

      const selectedStartDate = values[0]?.startOf("day");
      const selectedEndDate = values[1]?.endOf("day");

      return (
        (!selectedStartDate || endDate.isSameOrAfter(selectedStartDate)) &&
        (!selectedEndDate || startDate.isSameOrBefore(selectedEndDate))
      );
    });

    onChange(values, filteredEvents);
    setDateRange(values);
  }

  return (
    <DatePicker.RangePicker
      id={id}
      className="event-date-filter"
      value={dateRange}
      onChange={onDateChange}
      getPopupContainer={getPopupContainer}
    />
  );
};

export default EventDateFilter;
