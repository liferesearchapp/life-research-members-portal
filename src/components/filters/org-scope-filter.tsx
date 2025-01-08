// OrgScopeFilter is a functional component that returns an Ant Design Select component for selecting organization scopes.
// This component uses the OrgScopeCtx and LanguageCtx context and the GetLanguage utility.

import Select, { SelectProps } from "antd/lib/select";
import { type FC, useContext, useMemo } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { OrgScopeCtx } from "../../services/context/org-scopes-ctx";
import GetLanguage from "../../utils/front-end/get-language";

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const OrgScopeFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { orgScopes } = useContext(OrgScopeCtx);
  const { en } = useContext(LanguageCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => [
      { label: en ? "Empty" : "Vide", value: 0 },
      ...orgScopes.map((t) => ({
        label: <GetLanguage obj={t} />,
        value: t.id,
      })),
    ],
    [en, orgScopes]
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
      className="org-scope-filter"
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

export default OrgScopeFilter;
