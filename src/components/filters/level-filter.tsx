// LevelFilter is a functional component that acts as a filter for levels
// Utilizes antd's Select component and the levels data from the LevelsCtx context
// Props include the id, value, onChange and getPopupContainer for the Select component

import Select, { SelectProps } from "antd/lib/select";
import { type FC, useContext, useMemo } from "react";
import { LevelsCtx } from "../../services/context/levels-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import GetLanguage from "../../utils/front-end/get-language";

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const LevelFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { levels } = useContext(LevelsCtx);
  const { en } = useContext(LanguageCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => [
      { label: en ? "Empty" : "Vide", value: 0 },
      ...levels.map((t) => ({ label: <GetLanguage obj={t} />, value: t.id })),
    ],
    [en, levels]
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
      className="level-filter"
      mode="multiple"
      value={valueArray}
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

export default LevelFilter;
