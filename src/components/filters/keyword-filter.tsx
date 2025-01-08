// A component that allows the user to select multiple keywords from a list of all available keywords.
// The selected keywords are displayed as tags and can be deleted by the user.

import type { keyword } from "@prisma/client";
import Select, { SelectProps } from "antd/lib/select";
import {
  type FC,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { AllKeywordsCtx } from "../../services/context/all-keywords-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import fuzzyIncludes from "../../utils/front-end/fuzzy-includes";
import KeywordTag from "../keywords/keyword-tag";

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const KeywordFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { keywords, keywordMap } = useContext(AllKeywordsCtx);
  const { en } = useContext(LanguageCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const getOption = useCallback(
    (k: keyword) => {
      let labelAndValue = "";
      if (en) {
        if (k.name_en) labelAndValue += k.name_en;
        if (k.name_en && k.name_fr) labelAndValue += " / ";
        if (k.name_fr) labelAndValue += k.name_fr;
      }
      if (!en) {
        if (k.name_fr) labelAndValue += k.name_fr;
        if (k.name_fr && k.name_en) labelAndValue += " / ";
        if (k.name_en) labelAndValue += k.name_en;
      }
      return { label: labelAndValue, value: k.id };
    },
    [en]
  );

  const options = useMemo(
    () =>
      keywords
        .map((k) => getOption(k))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [getOption, keywords]
  );

  function onSelect(id: number) {
    value.add(id);
    onChange(value);
  }

  function onDelete(id: number) {
    value.delete(id);
    onChange(value);
  }

  function onClear() {
    onChange(new Set());
  }

  function filterOption(
    input: string,
    option?: (typeof options)[number]
  ): boolean {
    if (!option) return false;
    return fuzzyIncludes(option.label, input);
  }

  function tagRender(
    props: Parameters<NonNullable<SelectProps["tagRender"]>>[0]
  ) {
    const keyword = keywordMap.get(props.value);
    if (!keyword) return <></>;
    return <KeywordTag keyword={keyword} deletable onDelete={onDelete} />;
  }

  return (
    <Select
      id={id}
      className="keyword-filter"
      mode="multiple"
      options={options}
      value={valueArray}
      onSelect={onSelect}
      onDeselect={onDelete}
      getPopupContainer={getPopupContainer}
      filterOption={filterOption}
      allowClear
      onClear={onClear}
      tagRender={tagRender}
    ></Select>
  );
};

export default KeywordFilter;
