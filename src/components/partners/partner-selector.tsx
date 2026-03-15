/*
This component is a form element that allows a user to search for partners/organizations and select one or more of them. 
It uses the antd AutoComplete component to search for partners/organizations and display the results. 
The selected partners/organizations are displayed as tags, and the user can delete or edit the tags if desired. 
The component also provides an onChange callback that returns the selected partners/organizations as a Map.
*/

import type { organization } from "@prisma/client";
import { type FC, useContext, useEffect, useState } from "react";
import { AllOrganizationsCtx } from "../../services/context/all-organizations-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { OrganizationInfo } from "../../services/_types";
import OrganizationTag from "./partner-tag";
import { AutoComplete, Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";

type Props = {
  id?: string; // For connecting a label - antd form will pass this in
  value?: Map<number, organization>;
  onChange?: (value: Map<number, organization>) => void;
  setErrors?: (e: string[] | undefined) => void;
  max?: number;
};

const OrganizationSelector: FC<Props> = ({
  id = "",
  value = new Map<number, organization>(),
  max = 10,
  onChange = () => {},
  setErrors = () => {},
}) => {
  const {
    organizations,
    refresh: refreshOrganizations,
    set,
  } = useContext(AllOrganizationsCtx);
  const { en } = useContext(LanguageCtx);

  const [selectedValue, setSelectedValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialValue, setModalInitialValue] =
    useState<OrganizationInfo>();

  useEffect(() => {
    refreshOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*   useEffect(() => {
    setModalInitialValue(
      en
        ? { name_en: searchValue, name_fr: "" }
        : { name_en: "", name_fr: searchValue }
    );
  }, [searchValue, en]); */

  function getOption(k: organization) {
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
    return { label: labelAndValue, value: labelAndValue, organization: k };
  }

  const options = organizations
    .map((k) => getOption(k))
    .sort((a, b) => a.label.localeCompare(b.label));

  function clearState() {
    setSelectedValue("");
    setSearchValue("");
  }

  function onSelect(optionValue: string, option: (typeof options)[number]) {
    clearState();
    addToList(option.organization);
  }

  function onClickCreate() {
    if (value.size >= max) return setErrors?.([`Maximum ${max}`]);
    setModalOpen(true);
  }

  function onCreate(newOrganization: organization) {
    setModalOpen(false);
    set(newOrganization);
    clearState();
    addToList(newOrganization);
  }

  function onCancelCreate() {
    setModalOpen(false);
  }

  function addToList(organization: organization) {
    if (!value.has(organization.id) && value.size >= max)
      return setErrors?.([`Maximum ${max}`]);
    onChange?.(new Map(value).set(organization.id, organization));
  }

  function onDelete(id: number) {
    const next = new Map(value);
    next.delete(id);
    onChange(next);
    setErrors(undefined);
  }

  function onEdit(updatedOrganization: organization) {
    set(updatedOrganization);
    onChange(new Map(value).set(updatedOrganization.id, updatedOrganization));
  }

  return (
    <>
      <div className="organization-selector">
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
            <OrganizationTag
              key={k.id}
              organization={k}
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

export default OrganizationSelector;
