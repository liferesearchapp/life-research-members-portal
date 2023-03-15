import Select, { SelectProps } from "antd/lib/select";
import { FC, useContext, useMemo } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { EventTypesCtx } from "../../services/context/event-types-ctx";
import GetLanguage from "../../utils/front-end/get-language";

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const EventTypeFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { eventTypes } = useContext(EventTypesCtx);
  const { en } = useContext(LanguageCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => [
      { label: en ? "Empty" : "Vide", value: 0 },
      ...eventTypes.map((t) => ({
        label: <GetLanguage obj={t} />,
        value: t.id,
      })),
    ],
    [en, eventTypes]
  );

  function onSelect(id: number) {
    value.add(id);
    onChange(value);
  }

  function onDelete(id: number) {
    value.delete(id);
    onChange(value);
  }

  return (
    <Select
      id={id}
      className="event-type-filter"
      value={valueArray}
      mode="multiple"
      options={options}
      allowClear
      showSearch={false}
      showArrow
      onSelect={onSelect}
      onDeselect={onDelete}
      getPopupContainer={getPopupContainer}
    ></Select>
  );
};

export default EventTypeFilter;
