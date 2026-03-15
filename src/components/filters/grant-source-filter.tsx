/* This is a component that provides a dropdown list for selecting multiple sources of grants
Renders a list of options for grant sources with a value of 0 for "empty" 
Receives onChange, value, id and getPopupContainer props
*/

import Select, { SelectProps } from "antd/lib/select";
import { type FC, useContext, useMemo } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { GrantSourcesCtx } from "../../services/context/grant-sources-ctx";
import GetLanguage from "../../utils/front-end/get-language";

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const GrantSourceFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { grantSources } = useContext(GrantSourcesCtx);
  const { en } = useContext(LanguageCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => [
      {
        label: en ? "Empty" : "Vide",
        value: 0,
      },
      ...grantSources.map((t) => ({
        label: <GetLanguage obj={t} />,
        value: t.id,
      })),
    ],
    [en, grantSources]
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
      className="grant-source-filter"
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

export default GrantSourceFilter;
