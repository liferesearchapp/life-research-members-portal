// This is a component that provides a dropdown list for selecting multiple statuses of grant
// Uses grant statuses from GrantStatusCtx and language context from LanguageCtx to determine label language
// Triggers onSelect or onDeselect when an option is selected or deselected
// Supports custom popup container through getPopupContainer prop
// Exports the component as the default export

import Select, { SelectProps } from "antd/lib/select";
import { type FC, useContext, useMemo } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { GrantStatusCtx } from "../../services/context/grant-statuses-ctx";
import GetLanguage from "../../utils/front-end/get-language";

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const GrantStatusFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { grantStatuses } = useContext(GrantStatusCtx);
  const { en } = useContext(LanguageCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => [
      {
        label: en ? "Empty" : "Vide",
        value: 0,
      },
      ...grantStatuses.map((t) => ({
        label: <GetLanguage obj={t} />,
        value: t.id,
      })),
    ],
    [en, grantStatuses]
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
      className="grant-status-filter"
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

export default GrantStatusFilter;
