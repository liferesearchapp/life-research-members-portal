import { Button } from "antd";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import { FC, useContext } from "react";

import { useForm } from "antd/lib/form/Form";
import { LanguageCtx } from "../../services/context/language-ctx";
import registerInstitute from "../../services/register-institute";

type Data = {
  name: string;
  urlIdentifier: string;
  description_en: string;
  description_fr: string;
};

const RegisterInstitute: FC = () => {
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);

  async function handleRegister({
    name,
    urlIdentifier,
    description_en,
    description_fr,
  }: Data) {
    const res = await registerInstitute({
      name,
      urlIdentifier,
      description_en,
      description_fr,
    });
    if (res) form.resetFields();
  }

  return (
    <div className="register-account-form">
      <h1>{en ? "Create Institute" : "Créer un institut"}</h1>
      <h2 style={{ marginBottom: 24 }}>
        {en
          ? "This form will create a new institute."
          : "Ce formulaire créera un nouvel institut."}
      </h2>
      <Form
        form={form}
        onFinish={handleRegister}
        style={{ width: "100%", maxWidth: "25rem" }}
        size="large"
        layout="vertical"
      >
        <Form.Item
          label={en ? "Name" : "Nom"}
          name="name"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "URL Identifier" : "Identifiant URL"}
          name="urlIdentifier"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "Description (EN)" : "Description (EN)"}
          name="description_en"
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          label={en ? "Description (FR)" : "Description (FR)"}
          name="description_fr"
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

export default RegisterInstitute;
