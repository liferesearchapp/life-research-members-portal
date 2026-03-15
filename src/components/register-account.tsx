// This component implements a form for creating new user accounts
// with the ability to register as a Member or an Admin

import { Button, Select } from "antd";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import { type FC, useContext } from "react";
import registerAccount from "../services/register-account";
import Checkbox from "antd/lib/checkbox/Checkbox";
import { useForm } from "antd/lib/form/Form";
import { LanguageCtx } from "../services/context/language-ctx";
import { MemberInstituteCtx } from "../services/context/member-institutes-ctx";
import {
  useAdminDetails,
  useSelectedInstitute,
} from "../services/context/selected-institute-ctx";
import { ActiveAccountCtx } from "../services/context/active-account-ctx";

type Data = {
  login_email: string;
  confirm_email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_super_admin: boolean;
  is_member: boolean;
  institute_id: number[];
};

const { Option } = Select;

const RegisterAccount: FC = () => {
  // This hook is important for type checking the form
  const [form] = useForm<Data>();
  const { localAccount } = useContext(ActiveAccountCtx);
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();
  const { institutes } = useContext(MemberInstituteCtx);
  const isAdmin = useAdminDetails();

  async function handleRegister({
    first_name,
    last_name,
    login_email,
    is_admin,
    is_member,
    is_super_admin,
    institute_id,
  }: Data) {
    const res = await registerAccount({
      first_name,
      last_name,
      login_email,
      is_admin,
      is_member,
      is_super_admin,
      institute_id,
    });
    if (res) form.resetFields();
  }

  return (
    <div className="register-account-form">
      <h1>{en ? "Create Member Account" : "Créer un compte de membre"}</h1>
      <h2 style={{ marginBottom: 24 }}>
        {en
          ? "This form will create an account for the given email."
          : "Ce formulaire créera un compte pour le courriel fourni."}
      </h2>
      <Form
        form={form}
        onFinish={handleRegister}
        style={{ width: "100%", maxWidth: "25rem" }}
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
          label={en ? "Last Name" : "Nom de famille"}
          name="last_name"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "Email" : "Courriel"}
          name="login_email"
          rules={[
            { required: true, message: en ? "Required" : "Requis" },
            {
              type: "email",
              message: en ? "Invalid Email" : "Courriel invalide",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "Confirm Email" : "Confirmer le courriel"}
          name="confirm_email"
          validateFirst={true}
          rules={[
            { required: true, message: en ? "Required" : "Requis" },
            {
              type: "email",
              message: en ? "Invalid Email" : "Courriel invalide",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue("login_email") === value)
                  return Promise.resolve();
                return Promise.reject(
                  new Error(
                    en
                      ? "The two provided emails do not match"
                      : "Les deux courriels fournis ne correspondent pas"
                  )
                );
              },
            }),
          ]}
          dependencies={["login_email"]}
        >
          <Input />
        </Form.Item>

        {institute && (
          <Form.Item
            label={en ? "Select Institute" : "Sélectionnez l'institut"}
            name="institute_id"
            initialValue={[institute.id]}
            rules={[{ required: true, message: en ? "Required" : "Requis" }]}
          >
            <Select mode="multiple" defaultValue={institute?.id}>
              <Option value="">{""}</Option>
              {localAccount?.instituteAdmin.map((f) => (
                <Option key={f.institute.id} value={f.institute.id}>
                  {`${f.institute.name} - ${f.institute.urlIdentifier}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <div className="row">
          <Form.Item
            name="is_member"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>
              {en ? "Register as Member" : "Inscrivez-vous en tant que membre"}
            </Checkbox>
          </Form.Item>
          {
            // Only super admins can grant admin privileges
            isAdmin && (
              <Form.Item name="is_admin" valuePropName="checked">
                <Checkbox>
                  {en
                    ? "Grant Admin Privileges"
                    : "Accorder des privilèges d'administrateur"}
                </Checkbox>
              </Form.Item>
            )
          }
          {
            // Only super admins can grant admin privileges
            localAccount?.is_super_admin && (
              <Form.Item name="is_super_admin" valuePropName="checked">
                <Checkbox>
                  {en
                    ? "Grant Super Admin Privileges"
                    : "Accorder des privilèges d'administrateur"}
                </Checkbox>
              </Form.Item>
            )
          }
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ paddingLeft: 40, paddingRight: 40 }}
            size="large"
          >
            Register
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterAccount;
