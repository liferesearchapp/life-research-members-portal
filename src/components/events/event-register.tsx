// This component allows users to register a new event by providing the event's name in English and French, date range, event type, and a note.

import { Button, Col, DatePicker, Row, Switch } from "antd";
import Select from "antd/lib/select";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import React, { FC, useContext, useState } from "react";
import { useForm } from "antd/lib/form/Form";
import moment from "moment";
import type { Moment } from "moment";
import registerEvent from "../../services/register-event";
import { LanguageCtx } from "../../services/context/language-ctx";
import { EventTypesCtx } from "../../services/context/event-types-ctx";
import { AllTopicsCtx } from "../../services/context/all-topics-ctx";
import GetLanguage from "../../utils/front-end/get-language";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

const { Option } = Select;
const { RangePicker } = DatePicker; // Add RangePicker import

type EventData = {
  name_en: string;
  name_fr: string;
  date_range: [Moment | null, Moment | null];
  event_type_id: number;
  note: string;
  institute_id: number;
};

const RegisterEvent: FC = () => {
  const [form] = useForm<EventData>();
  const { en } = useContext(LanguageCtx);
  const { eventTypes } = useContext(EventTypesCtx);
  const { institute } = useSelectedInstitute();

  async function handleRegister({
    name_en,
    name_fr,
    date_range,
    event_type_id,
    note,
  }: EventData) {
    if (!institute) return;
    const res = await registerEvent({
      name_en,
      name_fr,
      start_date: date_range[0] ? date_range[0].toDate() : null, // Access start_date from date_range
      end_date: date_range[1] ? date_range[1].toDate() : null, // Access end_date from date_range
      event_type_id,
      note,
      institute_id: institute.id,
    });
    if (res) form.resetFields();
  }

  return (
    <div className="register-event-form">
      <h1>{en ? "Register Event" : "Enregistrer un événement"}</h1>
      <Form
        form={form}
        onFinish={handleRegister}
        style={{ width: "100%", maxWidth: "30rem" }}
        size="large"
        layout="vertical"
      >
        <Form.Item
          label={en ? "Name (English)" : "Nom (anglais)"}
          name="name_en"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={en ? "Name (French)" : "Nom (français)"}
          name="name_fr"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={en ? "Date Range" : "Plage de dates"} // Change the label to "Date Range"
          name="date_range" // Change the name to "date_range"
          className="date-range-picker"
        >
          <RangePicker />
        </Form.Item>

        <Form.Item
          label={en ? "Event Type" : "Type d'événement"}
          name="event_type_id"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Select>
            <Option value="">{""}</Option>
            {eventTypes.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={en ? "Note" : "Note"} name="note">
          <Input.TextArea />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ paddingLeft: 40, paddingRight: 40 }}
            size="large"
          >
            {en ? "Register" : "Enregistrer"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterEvent;
