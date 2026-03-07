// See https://ant.design/components/form/#components-form-demo-customized-form-controls

import type { topic } from "@prisma/client";
import { type FC, useContext, useEffect, useState } from "react";
import { AllTopicsCtx } from "../../services/context/all-topics-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { TopicInfo } from "../../services/_types";
import TopicTag from "./topic-tag";
import { AutoComplete, Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";

type Props = {
  id?: string; // For connecting a label - antd form will pass this in
  value?: Map<number, topic>;
  onChange?: (value: Map<number, topic>) => void;
  setErrors?: (e: string[] | undefined) => void;
  max?: number;
};

const TopicSelector: FC<Props> = ({
  id = "",
  value = new Map<number, topic>(),
  max = 10,
  onChange = () => {},
  setErrors = () => {},
}) => {
  const { topics, refresh: refreshTopics, set } = useContext(AllTopicsCtx);
  const { en } = useContext(LanguageCtx);

  const [selectedValue, setSelectedValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialValue, setModalInitialValue] = useState<TopicInfo>();

  useEffect(() => {
    refreshTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setModalInitialValue(
      en
        ? { name_en: searchValue, name_fr: "" }
        : { name_en: "", name_fr: searchValue }
    );
  }, [searchValue, en]);

  function getOption(k: topic) {
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
    return { label: labelAndValue, value: labelAndValue, topic: k };
  }

  const options = topics
    .map((k) => getOption(k))
    .sort((a, b) => a.label.localeCompare(b.label));

  function clearState() {
    setSelectedValue("");
    setSearchValue("");
  }

  function onSelect(optionValue: string, option: typeof options[number]) {
    clearState();
    addToList(option.topic);
  }

  function onClickCreate() {
    if (value.size >= max) return setErrors?.([`Maximum ${max}`]);
    setModalOpen(true);
  }

  function onCreate(newTopic: topic) {
    setModalOpen(false);
    set(newTopic);
    clearState();
    addToList(newTopic);
  }

  function onCancelCreate() {
    setModalOpen(false);
  }

  function addToList(topic: topic) {
    if (!value.has(topic.id) && value.size >= max)
      return setErrors?.([`Maximum ${max}`]);
    onChange?.(new Map(value).set(topic.id, topic));
  }

  function onDelete(id: number) {
    const next = new Map(value);
    next.delete(id);
    onChange(next);
    setErrors(undefined);
  }

  function onEdit(updatedTopic: topic) {
    set(updatedTopic);
    onChange(new Map(value).set(updatedTopic.id, updatedTopic));
  }

  return (
    <>
      <div className="topic-selector">
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
        </div>
        <Card className="tag-viewport" size="small">
          {Array.from(value.values()).map((k) => (
            <TopicTag
              key={k.id}
              topic={k}
              editable
              deletable
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </Card>
      </div>
    </>
  );
};

export default TopicSelector;
