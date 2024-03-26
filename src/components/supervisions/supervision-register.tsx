// This component is a form component to register a new supervision
// When the form is submitted, it will call the `registerSupervision` service to register the new supervision
// When the service returns successfully, the form will be reset

import { Button, Col, DatePicker, Row } from "antd";
import Select from "antd/lib/select";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import React, { FC, useContext } from "react";
import { useForm } from "antd/lib/form/Form";
import moment from "moment";
import type { Moment } from "moment";
import registerSupervision from "../../services/register-supervision";
import { LanguageCtx } from "../../services/context/language-ctx";
import { FacultiesCtx } from "../../services/context/faculties-ctx";
import { LevelsCtx } from "../../services/context/levels-ctx";
import GetLanguage from "../../utils/front-end/get-language";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

const { Option } = Select;
const { RangePicker } = DatePicker;

type SupervisionData = {
  last_name: string;
  first_name: string;
  date_range: [Moment | null, Moment | null];
  faculty_id: number | null;
  level_id: number | null;
  note: string | null;
  institute_id: number;
};

const RegisterSupervision: FC = () => {
  const [form] = useForm<SupervisionData>();
  const { en } = useContext(LanguageCtx);
  const { faculties } = useContext(FacultiesCtx);
  const { levels } = useContext(LevelsCtx);
  const { institute } = useSelectedInstitute();

  async function handleRegister({
    last_name,
    first_name,
    date_range,
    faculty_id,
    level_id,
    note,
  }: SupervisionData) {
    if (!institute) return;
    const res = await registerSupervision({
      last_name,
      first_name,
      start_date: date_range[0] ? date_range[0].toDate() : null, // Access start_date from date_range
      end_date: date_range[1] ? date_range[1].toDate() : null, // Access end_date from date_range
      faculty_id: faculty_id || null,
      level_id: level_id || null,
      note: note || null,
      institute_id: institute.id,
    });
    if (res) form.resetFields();
  }

  return (
    <div className="register-supervision-form">
      <h1>{en ? "Register Supervision" : "Enregistrer une supervision"}</h1>
      <Form
        form={form}
        onFinish={handleRegister}
        style={{ width: "100%", maxWidth: "30rem" }}
        size="large"
        layout="vertical"
      >
        <Form.Item
          label={en ? "First Name" : "Prénom"}
          name="first_name"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "Last Name" : "Nom"}
          name="last_name"
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

        <Form.Item label={en ? "Faculty" : "Faculté"} name="faculty_id">
          <Select>
            <Option value="">{""}</Option>
            {faculties.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={en ? "Level" : "Niveau"} name="level_id">
          <Select>
            <Option value="">{""}</Option>
            {levels.map((l) => (
              <Option key={l.id} value={l.id}>
                <GetLanguage obj={l} />
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

export default RegisterSupervision;
