import { Divider, Button, Form, Input, Modal, Typography } from "antd";
import { type FC, type PropsWithChildren, useState, useContext, useEffect } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { KeywordInfo } from "../../services/_types";
import type { keyword } from "@prisma/client";
import registerKeyword from "../../services/register-keyword";
import KeywordPreview from "./keyword-preview";
const { useForm } = Form;
const Title = Typography.Title;
const Text = Typography.Text;

type Props = {
  open: boolean;
  allKeywords: keyword[];
  initialValue?: KeywordInfo;
  onSuccess: (keyword: keyword) => void;
  onCancel: () => void;
};

const NewKeywordModal: FC<PropsWithChildren<Props>> = ({
  open,
  allKeywords,
  initialValue,
  onSuccess,
  onCancel,
}) => {
  const { en } = useContext(LanguageCtx);
  const [loading, setLoading] = useState(false);
  const [form] = useForm<KeywordInfo>();
  const [preview, setPreview] = useState<keyword>({
    name_en: "",
    name_fr: "",
    id: 0, // Tags require an id
    ...initialValue,
  });

  // Using the initialValues form property only updates on the first open, hence we need this effect
  useEffect(() => {
    if (open && initialValue) {
      // need to check that form is connected before setting values
      if (form.getFieldsValue()) form.setFieldsValue(initialValue);
      refreshPreview(initialValue);
    }
    // Modals are not destroyed on close, hence state needs to be cleared
    if (!open) {
      form.setFieldsValue({ name_en: "", name_fr: "" });
      form.setFields([
        { name: "name_en", errors: undefined },
        { name: "name_fr", errors: undefined },
      ]);
      refreshPreview({ name_en: "", name_fr: "" });
    }
  }, [initialValue, form, open]);

  function refreshPreview(info: KeywordInfo) {
    setPreview({
      name_en: info.name_en,
      name_fr: info.name_fr,
      id: 0, // Tags require an id
    });
  }

  async function handleCreate(info: KeywordInfo) {
    setLoading(true);
    const newKeyword = await registerKeyword({
      name_en: info.name_en || "",
      name_fr: info.name_fr || "",
    });
    if (newKeyword) onSuccess(newKeyword);
    setLoading(false);
  }

  const title = (
    <>
      <Title level={3}>{en ? "New Keyword" : "Nouveau mot-clé"}</Title>
      <Text style={{ fontSize: "14px" }}>
        {en
          ? "You are encouraged to provide both languages, but it is not required."
          : "Vous êtes encouragé(e) à fournir les deux langues, mais ce n'est pas obligatoire."}
      </Text>
    </>
  );

  return (
    <Modal title={title} open={open} onCancel={onCancel} footer={null} width={600} forceRender>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreate}
        onValuesChange={(changes, info) => refreshPreview(info)}
      >
        <Form.Item
          label={en ? "English" : "Anglais"}
          name="name_en"
          rules={[
            { max: 50, message: en ? "Maximum 50 characters" : "50 caractères maximum" },
            (form) => ({
              validator: (_, value?: string) => {
                if (form.getFieldValue("name_fr") || value) return Promise.resolve();
                return Promise.reject(
                  new Error(en ? "Provide at least one" : "Fournissez-en au moins un")
                );
              },
            }),
            {
              validator(_, value?: string) {
                if (
                  !allKeywords.find(
                    (k) => k.name_en && value && k.name_en.toLowerCase() === value.toLowerCase()
                  )
                )
                  return Promise.resolve();
                return Promise.reject(new Error(en ? "Already exists" : "Existe déjà"));
              },
            },
          ]}
          dependencies={["name_fr"]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={en ? "French" : "Français"}
          name="name_fr"
          rules={[
            { max: 50, message: en ? "Maximum 50 characters" : "50 caractères maximum" },
            (form) => ({
              validator(_, value?: string) {
                if (form.getFieldValue("name_en") || value) return Promise.resolve();
                return Promise.reject(
                  new Error(en ? "Provide at least one" : "Fournissez-en au moins un")
                );
              },
            }),
            () => ({
              validator(_, value?: string) {
                if (
                  !allKeywords.find(
                    (k) => k.name_fr && value && k.name_fr.toLowerCase() === value.toLowerCase()
                  )
                )
                  return Promise.resolve();
                return Promise.reject(new Error(en ? "Already exists" : "Existe déjà"));
              },
            }),
          ]}
          dependencies={["name_en"]}
        >
          <Input />
        </Form.Item>

        <KeywordPreview keyword={preview} label={{ en: "Preview", fr: "Aperçu" }} />

        <Divider />
        <Button
          htmlType="submit"
          type="primary"
          style={{ marginLeft: "auto", display: "block" }}
          loading={loading}
        >
          {en ? "Submit" : "Soumettre"}
        </Button>
      </Form>
    </Modal>
  );
};

export default NewKeywordModal;
