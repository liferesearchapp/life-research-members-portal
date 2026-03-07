import type { MemberPublicInfo } from "../../services/_types";
import { FC, useContext, useEffect, useState } from "react";
import { AllMembersSelectorCtx } from "../../services/context/all-members-selector-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import MemberTag from "./member-tag";
import { AutoComplete, Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";

type Props = {
  id?: string;
  value?: Map<number, MemberPublicInfo>;
  onChange?: (value: Map<number, MemberPublicInfo>) => void;
  setErrors?: (e: string[] | undefined) => void;
  max?: number;
};

const MemberSelector: FC<Props> = ({
  id = "",
  value = new Map<number, MemberPublicInfo>(),
  max = 1000,
  onChange = () => {},
  setErrors = () => {},
}) => {
  const { members } = useContext(AllMembersSelectorCtx);
  const { en } = useContext(LanguageCtx);

  const [selectedValue, setSelectedValue] = useState("");
  const [searchValue, setSearchValue] = useState("");

  function getOption(m: MemberPublicInfo) {
    const fullName = `${m.account.first_name} ${m.account.last_name}`;
    return { label: fullName, value: fullName, member: m };
  }

  const options = members
    .map((m) => getOption(m))
    .sort((a, b) => a.label.localeCompare(b.label));

  function clearState() {
    setSelectedValue("");
    setSearchValue("");
  }

  function onSelect(optionValue: string, option: (typeof options)[number]) {
    clearState();
    addToList(option.member);
  }

  function addToList(member: MemberPublicInfo) {
    if (!value.has(member.id) && value.size >= max)
      return setErrors?.([`Maximum ${max}`]);
    onChange?.(new Map(value).set(member.id, member));
  }

  function onDelete(id: number) {
    const next = new Map(value);
    next.delete(id);
    onChange(next);
    setErrors(undefined);
  }

  return (
    <>
      <div className="member-selector">
        <div className="header">
          <AutoComplete
            id={id}
            className="autocomplete"
            placeholder={en ? "Search Existing..." : "Rechercher..."}
            options={options}
            value={selectedValue}
            onChange={setSelectedValue}
            filterOption
            notFoundContent={en ? "No Matches" : "Aucune correspondance"}
            onSelect={onSelect}
            onSearch={setSearchValue}
          />
        </div>
        <Card className="tag-viewport" size="small">
          {Array.from(value.values()).map((m) => (
            <MemberTag key={m.id} member={m} deletable onDelete={onDelete} />
          ))}
        </Card>
      </div>
    </>
  );
};

export default MemberSelector;
