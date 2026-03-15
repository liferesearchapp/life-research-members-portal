// OrgNameFilter - a React component to filter a list of organizations by their name
// Implements antd's Select component with multiple selection mode
// Uses the AllPartnersCtx context to get a list of all organizations
// Uses the LanguageCtx context to determine the language to display the name in
// Renders each option as the name of the organization, in either English or French based on the language context
// Allows clearing the selection, and calls the onChange prop with an empty Set when it is cleared

import Select, { SelectProps } from "antd/lib/select";
import { type FC, useContext, useMemo } from "react";
import { AllPartnersCtx } from "../../services/context/all-partners-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { PartnerPublicInfo } from "../../services/_types";
import fuzzyIncludes from "../../utils/front-end/fuzzy-includes";

function getName(organization: PartnerPublicInfo, en: boolean) {
  return en ? organization.name_en : organization.name_fr;
}

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const OrgNameFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { allPartners } = useContext(AllPartnersCtx);
  const { en } = useContext(LanguageCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => allPartners.map((m) => ({ label: getName(m, en), value: m.id })),
    [allPartners, en]
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
    option?: typeof options[number]
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

export default OrgNameFilter;
