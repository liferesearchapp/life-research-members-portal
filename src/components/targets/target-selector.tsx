// See https://ant.design/components/form/#components-form-demo-customized-form-controls

import type { target } from "@prisma/client";
import { FC, useContext, useEffect, useState } from "react";
import { AllTargetsCtx } from "../../services/context/all-targets-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { TargetInfo } from "../../services/_types";
import TargetTag from "./target-tag";
import { AutoComplete, Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";

type Props = {
  id?: string; // For connecting a label - antd form will pass this in
  value?: Map<number, target>;
  onChange?: (value: Map<number, target>) => void;
  setErrors?: (e: string[] | undefined) => void;
  max?: number;
};

const TargetSelector: FC<Props> = ({
  id = "",
  value = new Map<number, target>(),
  max = 10,
  onChange = () => {},
  setErrors = () => {},
}) => {
  const { targets, refresh: refreshTargets, set } = useContext(AllTargetsCtx);
  const { en } = useContext(LanguageCtx);

  const [selectedValue, setSelectedValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialValue, setModalInitialValue] = useState<TargetInfo>();

  useEffect(() => {
    refreshTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setModalInitialValue(
      en
        ? { name_en: searchValue, name_fr: "" }
        : { name_en: "", name_fr: searchValue }
    );
  }, [searchValue, en]);

  function getOption(k: target) {
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
    return { label: labelAndValue, value: labelAndValue, target: k };
  }

  const options = targets
    .map((k) => getOption(k))
    .sort((a, b) => a.label.localeCompare(b.label));

  function clearState() {
    setSelectedValue("");
    setSearchValue("");
  }

  function onSelect(optionValue: string, option: (typeof options)[number]) {
    clearState();
    addToList(option.target);
  }

  function onClickCreate() {
    if (value.size >= max) return setErrors?.([`Maximum ${max}`]);
    setModalOpen(true);
  }

  function onCreate(newTarget: target) {
    setModalOpen(false);
    set(newTarget);
    clearState();
    addToList(newTarget);
  }

  function onCancelCreate() {
    setModalOpen(false);
  }

  function addToList(target: target) {
    if (!value.has(target.id) && value.size >= max)
      return setErrors?.([`Maximum ${max}`]);
    onChange?.(new Map(value).set(target.id, target));
  }

  function onDelete(id: number) {
    const next = new Map(value);
    next.delete(id);
    onChange(next);
    setErrors(undefined);
  }

  function onEdit(updatedTarget: target) {
    set(updatedTarget);
    onChange(new Map(value).set(updatedTarget.id, updatedTarget));
  }

  return (
    <>
      <div className="target-selector">
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
            <TargetTag
              key={k.id}
              target={k}
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

export default TargetSelector;
