import { Divider, Button, Form, Input, Modal, Typography } from "antd";
import { FC, useState, useContext } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { KeywordInfo } from "../../services/_types";
import type { keyword } from "@prisma/client";
import { red } from "@ant-design/colors";
import updateKeyword from "../../services/update-keyword";
import { useEffect } from "react";
import KeywordPreview from "./keyword-preview";
import { AllKeywordsCtx } from "../../services/context/all-keywords-ctx";
const { useForm } = Form;
const Title = Typography.Title;
const Text = Typography.Text;

type Props = {
  keyword: keyword;
  open: boolean;
  onSuccess: (keyword: keyword) => void;
  onCancel: () => void;
};

const EditKeywordModal: FC<Props> = ({ keyword, open, onSuccess, onCancel }) => {
  const { en } = useContext(LanguageCtx);
  const { keywords: allKeywords } = useContext(AllKeywordsCtx);
  const [loading, setLoading] = useState(false);
  const [form] = useForm<KeywordInfo>();
  const [preview, setPreview] = useState<keyword>(keyword);

  // Using the initialValues form property only updates on the first open, hence we need this effect
  useEffect(() => {
    if (open) {
      // need to check that form is connected before setting values
      if (form.getFieldsValue()) form.setFieldsValue(keyword);
      setPreview(keyword);
    }
  }, [keyword, form, open]);

  async function handleUpdate(info: KeywordInfo) {
    setLoading(true);
    const updatedKeyword = await updateKeyword(keyword.id, {
      name_en: info.name_en || "",
      name_fr: info.name_fr || "",
    });
    if (updatedKeyword) onSuccess(updatedKeyword);
    setLoading(false);
  }

  const title = (
    <>
      <Title level={3}>{en ? "Edit Keyword" : "Modifier mot-clé"}</Title>
      <Text style={{ fontSize: "14px", whiteSpace: "pre-wrap", color: red[5] }}>
        {en
          ? "This will affect any other members with this keyword!\nPlease only edit keywords to correct typos or provide translations."
          : "Cela affectera tous les autres membres avec ce mot-clé !\nVeuillez ne modifier les mots-clés que pour corriger les fautes d'orthographe ou fournir des traductions."}
      </Text>
    </>
  );

  return (
    <Modal title={title} open={open} onCancel={onCancel} footer={null} width={600} forceRender>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpdate}
        onValuesChange={(changes) => setPreview((prev) => ({ ...prev, ...changes }))}
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
                    (k) =>
                      k.name_en &&
                      value &&
                      k.id !== keyword.id &&
                      k.name_en.toLowerCase() === value.toLowerCase()
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
                    (k) =>
                      k.name_fr &&
                      value &&
                      k.id !== keyword.id &&
                      k.name_fr.toLowerCase() === value.toLowerCase()
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

        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
          <div style={{ flexGrow: 1 }}>
            <KeywordPreview keyword={keyword} label={{ en: "Original", fr: "Original" }} />
          </div>
          <div style={{ flexGrow: 1 }}>
            <KeywordPreview keyword={preview} label={{ en: "New", fr: "Nouveau" }} />
          </div>
        </div>

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

export default EditKeywordModal;
