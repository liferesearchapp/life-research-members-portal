//This component is a form element that allows a user to search for existing events and select one or more of them.

import type { event } from "@prisma/client";
import AutoComplete from "antd/lib/auto-complete";
import Card from "antd/lib/card";
import { type FC, useContext, useEffect, useState } from "react";
import { EventsCtx } from "../../services/context/events-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { EventPublicInfo } from "../../services/_types";
import EventTag from "./event-tag";

type Props = {
  id?: string; // For connecting a label - antd form will pass this in
  value?: Map<number, event>;
  onChange?: (value: Map<number, event>) => void;
  setErrors?: (e: string[] | undefined) => void;
  max?: number;
};

const EventSelector: FC<Props> = ({
  id = "",
  value = new Map<number, event>(),
  max = 10,
  onChange = () => {},
  setErrors = () => {},
}) => {
  const { events, refresh: refreshEvents, set } = useContext(EventsCtx);
  const { en } = useContext(LanguageCtx);

  const [selectedValue, setSelectedValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialValue, setModalInitialValue] = useState<EventPublicInfo>();

  useEffect(() => {
    refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getOption(k: event) {
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
    return { label: labelAndValue, value: labelAndValue, event: k };
  }

  const options = events
    .map((k) => getOption(k))
    .sort((a, b) => a.label.localeCompare(b.label));

  function clearState() {
    setSelectedValue("");
    setSearchValue("");
  }

  function onSelect(optionValue: string, option: (typeof options)[number]) {
    clearState();
    addToList(option.event);
  }

  function addToList(event: event) {
    if (!value.has(event.id) && value.size >= max)
      return setErrors?.([`Maximum ${max}`]);
    onChange?.(new Map(value).set(event.id, event));
  }

  function onDelete(id: number) {
    const next = new Map(value);
    next.delete(id);
    onChange(next);
    setErrors(undefined);
  }

  function onEdit(updatedEvent: event) {
    set(updatedEvent);
    onChange(new Map(value).set(updatedEvent.id, updatedEvent));
  }

  return (
    <>
      <div className="event-selector">
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
            <EventTag
              key={k.id}
              event={k}
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

export default EventSelector;
