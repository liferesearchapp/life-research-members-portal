// SupervisionNameFilter is a React functional component that provides a multiselect dropdown for filtering a list of supervisions based on their names.
// The component uses the Ant Design Select component and the `allSupervisions` context from `AllSupervisionsCtx`.

import Select, { SelectProps } from "antd/lib/select";
import { type FC, useContext, useMemo } from "react";
import { AllSupervisionsCtx } from "../../services/context/all-supervisions-ctx";
import type { SupervisionPublicInfo } from "../../services/_types";
import fuzzyIncludes from "../../utils/front-end/fuzzy-includes";

function getName(supervision: SupervisionPublicInfo) {
  return supervision.first_name + " " + supervision.last_name;
}

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const SupervisionNameFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { allSupervisions } = useContext(AllSupervisionsCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => allSupervisions.map((m) => ({ label: getName(m), value: m.id })),
    [allSupervisions]
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

export default SupervisionNameFilter;
