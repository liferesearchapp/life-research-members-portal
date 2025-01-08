// A component to filter members based on their name. It's a multi-select component based on Ant Design's Select component.
// Imports necessary dependencies including Ant Design's Select component and the necessary contexts to access member information.
// Includes fuzzy search functionality to match the input string with member names.


import Select, { SelectProps } from "antd/lib/select";
import { type FC, useContext, useMemo } from "react";
import { AllMembersCtx } from "../../services/context/all-members-ctx";
import type { MemberPublicInfo } from "../../services/_types";
import fuzzyIncludes from "../../utils/front-end/fuzzy-includes";

function getName(member: MemberPublicInfo) {
  return member.account.first_name + " " + member.account.last_name;
}

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const MemberNameFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { allMembers } = useContext(AllMembersCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => allMembers.map((m) => ({ label: getName(m), value: m.id })),
    [allMembers]
  );

  function onSelect(id: number) {
    value.add(id);
    onChange(value);
  }

  function onDelete(id: number) {
    value.delete(id);
    onChange(value);
  }

  function filterOption(input: string, option?: typeof options[number]): boolean {
    if (!option) return false;
    return fuzzyIncludes(option.label, input);
  }

  return (
    <Select
      id={id}
      className="name-filter"
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

export default MemberNameFilter;
