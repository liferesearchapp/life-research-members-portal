import { Button, Col, DatePicker, Row, Switch } from "antd";
import Select from "antd/lib/select";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import React, { FC, useContext, useState } from "react";
import { useForm } from "antd/lib/form/Form";
import moment from "moment";
import type { Moment } from "moment";
import registerGrant from "../../services/register-grant";
import { LanguageCtx } from "../../services/context/language-ctx";
import { GrantSourcesCtx } from "../../services/context/grant-sources-ctx";
import { GrantStatusCtx } from "../../services/context/grant-statuses-ctx";
import { AllTopicsCtx } from "../../services/context/all-topics-ctx";
import GetLanguage from "../../utils/front-end/get-language";

const { Option } = Select;

type GrantData = {
  title: string;
  amount: string;
  status_id: number;
  submission_date: Moment | null;
  obtained_date: Moment | null;
  completed_date: Moment | null;
  source_id: number;
  all_investigator: string;
  topic_id: number;
  note: string;
};

const RegisterGrant: FC = () => {
  const [form] = useForm<GrantData>();
  const { en } = useContext(LanguageCtx);
  const { grantSources } = useContext(GrantSourcesCtx);
  const { grantStatuses } = useContext(GrantStatusCtx);
  const { topics } = useContext(AllTopicsCtx);
  const [throughtLRI, setThroughtLRI] = useState(false);

  async function handleRegister({
    title,
    amount,
    status_id,
    submission_date,
    obtained_date,
    completed_date,
    source_id,
    all_investigator,
    topic_id,
    note,
  }: GrantData) {
    const res = await registerGrant({
      title,
      amount: parseFloat(amount), // Convert amount to a float
      throught_lri: throughtLRI,
      status_id,
      submission_date: submission_date ? submission_date.toDate() : null,
      obtained_date: obtained_date ? obtained_date.toDate() : null,
      completed_date: completed_date ? completed_date.toDate() : null,
      source_id,
      all_investigator,
      topic_id,
      note,
    });
    if (res) form.resetFields();
  }

  return (
    <div className="register-grant-form">
      <h1>{en ? "Register Grant" : "Enregistrer une subvention"}</h1>
      <Form
        form={form}
        onFinish={handleRegister}
        style={{ width: "100%", maxWidth: "30rem" }}
        size="large"
        layout="vertical"
      >
        <Form.Item
          label={en ? "Title" : "Titre"}
          name="title"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={en ? "Amount" : "Montant"}
          name="amount"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input type="number" />
        </Form.Item>

        <Form.Item
          label={en ? "Status" : "Statut"}
          name="status_id"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Select>
            <Option value="">{""}</Option>
            {grantStatuses.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={en ? "Submission Date" : "Date de soumission"}
          name="submission_date"
          className="date-picker"
        >
          <DatePicker />
        </Form.Item>

        <Form.Item
          label={en ? "Obtained Date" : "Date d'obtention"}
          name="obtained_date"
          className="date-picker"
        >
          <DatePicker />
        </Form.Item>

        <Form.Item
          label={en ? "Completed Date" : "Date de clôture"}
          name="completed_date"
          className="date-picker"
        >
          <DatePicker />
        </Form.Item>

        <Form.Item
          label={en ? "Source" : "Source"}
          name="source_id"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Select>
            <Option value="">{""}</Option>
            {grantSources.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={en ? "All Investigators" : "Tous les chercheurs"}
          name="all_investigator"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input.TextArea />
        </Form.Item>

        <Form.Item
          label={en ? "Topic" : "Sujet"}
          name="topic_id"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Select>
            <Option value="">{""}</Option>
            {topics.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="throught_lri"
          valuePropName="checked"
          style={{ display: "inline-block" }}
        >
          {en ? "Through LRI: " : "Par l'intermédiaire du LRI: "}
          <Switch
            checked={throughtLRI}
            onChange={() => setThroughtLRI(!throughtLRI)}
          />
          {throughtLRI ? " Yes" : " No"}
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

export default RegisterGrant;
