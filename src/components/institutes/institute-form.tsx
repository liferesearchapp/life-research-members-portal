import Button from "antd/lib/button";
import Form from "antd/lib/form";
import { useForm } from "antd/lib/form/Form";
import Input from "antd/lib/input";
import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import type { InstituteInfo } from "../../services/_types";
import { LanguageCtx } from "../../services/context/language-ctx";
import Divider from "antd/lib/divider";
import Text from "antd/lib/typography/Text";
import type { UpdateInstituteParams } from "../../pages/api/update-institute/[id]/private";
import updateInstitute from "../../services/update-institute";
import { red } from "@ant-design/colors";
import Switch from "antd/lib/switch";
import Notification from "../../services/notifications/notification";
import { SaveChangesCtx, useResetDirtyOnUnmount } from "../../services/context/save-changes-ctx";

type Props = {
  institute: InstituteInfo;
  onSuccess: (institute: InstituteInfo) => void;
};

type Data = {
  name: string;
  urlIdentifier: string;
  description_en: string;
  description_fr: string;
  is_active: boolean;
};

const InstituteForm: FC<Props> = ({ institute, onSuccess }) => {
  // This sets the return type of the form
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(institute.is_active);
  const { dirty, setDirty, setSubmit } = useContext(SaveChangesCtx);
  useResetDirtyOnUnmount();

  /** Submits validated data */
  const submitValidated = useCallback(
    async (data: Data): Promise<boolean> => {
      if (!dirty) {
        new Notification().warning(en ? "No Changes" : "Aucun changement");
        return true;
      }
      setLoading(true);
      const params: UpdateInstituteParams = {
        name: data.name,
        urlIdentifier: data.urlIdentifier,
        description_en: data.description_en,
        description_fr: data.description_fr,
        is_active: data.is_active,
      };
      const newInfo = await updateInstitute(institute.id, params);
      setLoading(false);
      if (newInfo) {
        setDirty(false);
        onSuccess(newInfo);
      }
      return !!newInfo;
    },
    [dirty, en, institute.id, onSuccess, setDirty]
  );

  /** When called from context - need to validate manually */
  const validateAndSubmit = useCallback(async () => {
    try {
      return submitValidated(await form.validateFields());
    } catch (e: any) {
      new Notification().warning(en ? "A field is invalid!" : "Un champ est invalide!");
      return false;
    }
  }, [en, form, submitValidated]);

  /** Pass submit function to context */
  useEffect(() => {
    setSubmit(() => validateAndSubmit);
  }, [setSubmit, validateAndSubmit]);

  function onChange(changed: any, data: Data) {
    setDirty(true);
    if (status !== data.is_active) setStatus(data.is_active);
  }

  const initialValues: Data = {
    name: institute.name,
    urlIdentifier: institute.urlIdentifier,
    description_en: institute.description_en || "",
    description_fr: institute.description_fr || "",
    is_active: institute.is_active,
  };

  return (
    <div className="institute-form-container">
      <Text strong>
        {en
          ? "This information will only be seen by super administrators."
          : "Ces informations ne seront visibles que par les super administrateurs."}
      </Text>
      <Divider />
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="institute-form"
        onValuesChange={onChange}
      >
        <Form.Item
          name="is_active"
          valuePropName="checked"
          label={
            status
              ? en
                ? "Status: Active"
                : "Statut : Actif"
              : en
              ? "Status: Inactive"
              : "Statut : Inactif"
          }
          help={
            <Text style={{ color: red[5] }}>
              {status
                ? ""
                : en
                ? "This institute will be hidden"
                : "Cet institut sera caché"}
            </Text>
          }
        >
          <Switch />
        </Form.Item>

        <div className="row">
          <Form.Item label={en ? "Name" : "Nom"} name="name" className="name">
            <Input />
          </Form.Item>
          <Form.Item label={en ? "URL Identifier" : "Identifiant URL"} name="urlIdentifier" className="urlIdentifier">
            <Input />
          </Form.Item>
          <Form.Item label="Description (EN)" name="description_en" className="description_en">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="Description (FR)" name="description_fr" className="description_fr">
            <Input.TextArea />
          </Form.Item>
        </div>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            style={{ paddingLeft: 40, paddingRight: 40 }}
            size="large"
            loading={loading}
          >
            {en ? "Save Changes" : "Sauvegarder"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default InstituteForm;
