/*
This is a component that provides a dropdown list for selecting multiple name of grants
Uses the AllGrantsCtx for all grants data, and receives filter value, change event handler and getPopupContainer as props.
Renders antd Select component with multiple select mode, filter option, clear button, select/deselect events, and getPopupContainer prop.
*/

import Select, { SelectProps } from "antd/lib/select";
import { type FC, useContext, useMemo } from "react";
import { AllGrantsCtx } from "../../services/context/all-grants-ctx";
import type { GrantPublicInfo } from "../../services/_types";
import fuzzyIncludes from "../../utils/front-end/fuzzy-includes";

function getTitle(grant: GrantPublicInfo) {
  return grant.title;
}

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const GrantNameFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { allGrants } = useContext(AllGrantsCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => allGrants.map((g) => ({ label: getTitle(g), value: g.id })),
    [allGrants]
  );

  function onSelect(id: number) {
    value.add(id);
    onChange(value);
  }

  function onDelete(id: number) {
    value.delete(id);
    onChange(value);
  }

  function filterOption(
    input: string,
    option?: (typeof options)[number]
  ): boolean {
    if (!option) return false;
    return fuzzyIncludes(option.label, input);
  }
  //return
  return (
    <Select
      id={id}
      className="grant-title-filter"
      value={valueArray}
      filterOption={filterOption}
      mode="multiple"
      options={options}
      allowClear
      onSelect={onSelect}
      onDeselect={onDelete}
      getPopupContainer={getPopupContainer}
    ></Select>
  );
};

export default GrantNameFilter;
