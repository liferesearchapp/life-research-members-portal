import { FC, useContext, useState } from "react";
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
      return (
        (!values[0] || startDate.isSameOrAfter(values[0])) &&
        (!values[1] || startDate.isSameOrBefore(values[1]))
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