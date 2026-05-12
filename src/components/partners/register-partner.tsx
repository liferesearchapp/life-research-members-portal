// This component is a form that allows an admin user to register a partner organization.
// The form takes in the English and French names of the organization, the scope and type of the organization, and a description.
// The component uses the useForm hook from antd/lib/form/Form to handle form data and the onFinish event to trigger the registerPartner function from the "../../services/register-partner-member" service.
// The component also uses context from the LanguageCtx, OrgTypesCtx, and OrgScopeCtx contexts to determine the language of the form and the available options for organization scope and type.

import { Button } from "antd";
import Select from "antd/lib/select";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import React, { FC, useContext } from "react";
import { useForm } from "antd/lib/form/Form";
import registerPartner from "../../services/register-partner";
import { LanguageCtx } from "../../services/context/language-ctx";
import { OrgTypesCtx } from "../../services/context/org-types-ctx";
import { OrgScopeCtx } from "../../services/context/org-scopes-ctx";
import GetLanguage from "../../utils/front-end/get-language";
import { MemberInstituteCtx } from "../../services/context/member-institutes-ctx";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

const { Option } = Select;

type Data = {
  name_en: string;
  name_fr: string;
  scope_id: number;
  type_id: number;
  description: string;
  institute_id: number[];
};

const RegisterPartner: FC = () => {
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const { orgTypes } = useContext(OrgTypesCtx);
  const { orgScopes } = useContext(OrgScopeCtx);
  const { institutes } = useContext(MemberInstituteCtx);
  const { institute } = useSelectedInstitute();

  async function handleRegister({
    name_en,
    name_fr,
    scope_id,
    type_id,
    description,
    institute_id,
  }: Data) {
    const res = await registerPartner({
      name_en,
      name_fr,
      scope_id,
      type_id,
      description,
      institute_id,
    });
    if (res) form.resetFields();
  }

  return (
    <div className="register-partner-form">
      <h1>{en ? "Register Partner" : "Enregistrer un partenaire"}</h1>
      <Form
        form={form}
        onFinish={handleRegister}
        style={{ width: "100%", maxWidth: "25rem" }}
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
          label={en ? "Organization Scope" : "Portée de l'organisation"}
          name="scope_id"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Select>
            <Option value="">{""}</Option>
            {orgScopes.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={en ? "Organization Type" : "Type d'organisation"}
          name="type_id"
        >
          <Select>
            <Option value="">{""}</Option>
            {orgTypes.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>
        {institute && (
          <Form.Item
            label={en ? "Select Institute" : "Sélectionnez l'institut"}
            name="institute_id"
            initialValue={[institute.id]}
          >
            <Select mode="multiple">
              <Option value="">{""}</Option>
              {institutes.map((f) => (
                <Option key={f.id} value={f.id}>
                  {`${f.name} - ${f.urlIdentifier}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
        <Form.Item
          label={en ? "Description" : "Description"}
          name="description"
        >
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

export default RegisterPartner;
