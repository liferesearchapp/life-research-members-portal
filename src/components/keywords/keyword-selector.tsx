// See https://ant.design/components/form/#components-form-demo-customized-form-controls

import type { keyword } from "@prisma/client";
import { FC, useContext, useEffect, useState } from "react";
import { AllKeywordsCtx } from "../../services/context/all-keywords-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { KeywordInfo } from "../../services/_types";
import KeywordTag from "./keyword-tag";
import NewKeywordModal from "./new-keyword-modal";
import { AutoComplete, Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";

type Props = {
  id?: string; // For connecting a label - antd form will pass this in
  value?: Map<number, keyword>;
  onChange?: (value: Map<number, keyword>) => void;
  setErrors?: (e: string[] | undefined) => void;
  max?: number;
};

const KeywordSelector: FC<Props> = ({
  id = "",
  value = new Map<number, keyword>(),
  max = 20,
  onChange = () => {},
  setErrors = () => {},
}) => {
  const {
    keywords,
    refresh: refreshKeywords,
    set,
  } = useContext(AllKeywordsCtx);
  const { en } = useContext(LanguageCtx);

  const [selectedValue, setSelectedValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialValue, setModalInitialValue] = useState<KeywordInfo>();

  useEffect(() => {
    refreshKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setModalInitialValue(
      en
        ? { name_en: searchValue, name_fr: "" }
        : { name_en: "", name_fr: searchValue }
    );
  }, [searchValue, en]);

  function getOption(k: keyword) {
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
    return { label: labelAndValue, value: labelAndValue, keyword: k };
  }

  const options = keywords
    .map((k) => getOption(k))
    .sort((a, b) => a.label.localeCompare(b.label));

  function clearState() {
    setSelectedValue("");
    setSearchValue("");
  }

  function onSelect(optionValue: string, option: (typeof options)[number]) {
    clearState();
    addToList(option.keyword);
  }

  function onClickCreate() {
    if (value.size >= max) return setErrors?.([`Maximum ${max}`]);
    setModalOpen(true);
  }

  function onCreate(newKeyword: keyword) {
    setModalOpen(false);
    set(newKeyword);
    clearState();
    addToList(newKeyword);
  }

  function onCancelCreate() {
    setModalOpen(false);
  }

  function addToList(keyword: keyword) {
    if (!value.has(keyword.id) && value.size >= max)
      return setErrors?.([`Maximum ${max}`]);
    onChange?.(new Map(value).set(keyword.id, keyword));
  }

  function onDelete(id: number) {
    const next = new Map(value);
    next.delete(id);
    onChange(next);
    setErrors(undefined);
  }

  function onEdit(updatedKeyword: keyword) {
    set(updatedKeyword);
    onChange(new Map(value).set(updatedKeyword.id, updatedKeyword));
  }

  return (
    <>
      <div className="keyword-selector">
        <div className="header">
          <AutoComplete
            id={id}
            className="autocomplete"
            placeholder={en ? "Search Existing..." : "Rechercher..."}
            options={options}
            value={selectedValue}
            onChange={setSelectedValue}
            filterOption
            notFoundContent={en ? "No Matches" : "Pas de correspondance"}
            onSelect={onSelect}
            onSearch={setSearchValue}
          />
          <Button
            className="create-new-button"
            type="primary"
            icon={<PlusOutlined />}
            onClick={onClickCreate}
          >
            {en ? "Create New" : "Créer un nouveau"}
          </Button>
        </div>
        <Card className="tag-viewport" size="small">
          {Array.from(value.values()).map((k) => (
            <KeywordTag
              key={k.id}
              keyword={k}
              editable
              deletable
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </Card>
      </div>

      <NewKeywordModal
        open={modalOpen}
        allKeywords={keywords}
        onSuccess={onCreate}
        onCancel={onCancelCreate}
        initialValue={modalInitialValue}
      />
    </>
  );
};

export default KeywordSelector;
