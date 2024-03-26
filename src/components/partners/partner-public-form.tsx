// This component allows editing of public information of a Partner, such as name, type, scope, and description.
// It makes use of the Ant Design form components, and updates the information by calling the updatePartnerPublic function.
// It also displays a notification on success or failure of the update.

import Button from "antd/lib/button";
import Form from "antd/lib/form";
import { useForm } from "antd/lib/form/Form";
import Input from "antd/lib/input";
import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import { red } from "@ant-design/colors";
import Switch from "antd/lib/switch";
import Notification from "../../services/notifications/notification";
import {
  SaveChangesCtx,
  useResetDirtyOnUnmount,
} from "../../services/context/save-changes-ctx";
import type {
  PartnerPublicInfo,
  PartnerPrivateInfo,
} from "../../services/_types";
import type { UpdatePartnerPublicParams } from "../../pages/api/update-partner/[id]/public";
import updatePartnerPublic from "../../services/update-partner-public";
import { LanguageCtx } from "../../services/context/language-ctx";
import Divider from "antd/lib/divider";
import Text from "antd/lib/typography/Text";
import { OrgTypesCtx } from "../../services/context/org-types-ctx";
import { OrgScopeCtx } from "../../services/context/org-scopes-ctx";
import { Select } from "antd";
import GetLanguage from "../../utils/front-end/get-language";
import { MemberInstituteCtx } from "../../services/context/member-institutes-ctx";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  partner: PartnerPublicInfo;
  onSuccess: (partner: PartnerPrivateInfo) => void;
};

const { Option } = Select;

type Data = {
  name_en: string;
  name_fr: string;
  scope_id?: number;
  type_id?: number;
  description: string | null;
  institute_id: number[];
};

const PublicPartnerForm: FC<Props> = ({ partner, onSuccess }) => {
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const { orgTypes } = useContext(OrgTypesCtx);
  const { orgScopes } = useContext(OrgScopeCtx);
  const { institutes } = useContext(MemberInstituteCtx);
  const { institute } = useSelectedInstitute();
  const [loading, setLoading] = useState(false);
  const { dirty, setDirty, setSubmit } = useContext(SaveChangesCtx);
  useResetDirtyOnUnmount();

  const submitValidated = useCallback(
    async (data: Data): Promise<boolean> => {
      if (!dirty) {
        new Notification().warning(en ? "No Changes" : "Aucun changement");
        return true;
      }
      setLoading(true);
      const params: UpdatePartnerPublicParams = {
        name_en: data.name_en,
        name_fr: data.name_fr,
        scope_id: data.scope_id || null,
        type_id: data.type_id || null,
        description: data.description,
        institute_id: data.institute_id,
      };

      const newPartner = await updatePartnerPublic(partner.id, params);
      setLoading(false);
      if (newPartner) {
        setDirty(false);
        onSuccess(newPartner);
      }
      return !!newPartner;
    },
    [dirty, en, onSuccess, partner.id, setDirty]
  );

  const validateAndSubmit = useCallback(async () => {
    try {
      return submitValidated(await form.validateFields());
    } catch (e: any) {
      new Notification().warning(
        en ? "A field is invalid!" : "Un champ est invalide !"
      );
      return false;
    }
  }, [en, form, submitValidated]);

  useEffect(() => {
    setSubmit(() => validateAndSubmit);
  }, [setSubmit, validateAndSubmit]);

  const initialValues: Data = {
    name_en: partner.name_en || "",
    name_fr: partner.name_fr || "",
    scope_id: partner.org_scope?.id,
    type_id: partner.org_type?.id,
    description: partner.description || "",
    institute_id: partner.organizationInstitute
      ? partner.organizationInstitute.map((i) => i.institute.id)
      : [],
  };

  return (
    <div className="public-partner-form-container">
      <Divider />
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="public-partner-form"
        onValuesChange={() => setDirty(true)}
      >
        <div className="row">
          <Form.Item
            label={en ? "Name (EN)" : "Nom (EN)"}
            name="name_en"
            className="name-en"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={en ? "Name (FR)" : "Nom (FR)"}
            name="name_fr"
            className="name-fr"
          >
            <Input />
          </Form.Item>
        </div>
        <div className="row">
          <Form.Item
            className="org_scope"
            label={en ? "Organization scope" : "Champ d'activité"}
            name="scope_id"
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
        </div>

        <Form.Item
          className="org_type"
          label={en ? "Organization type" : "Type d'organisation"}
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

        <Form.Item
          label={en ? "Select Institute" : "Sélectionnez l'institut"}
          name="institute_id"
          initialValue={[institute?.id]}
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

        <div className="row">
          <Form.Item
            label={en ? "Description" : "Description"}
            name="description"
            className="description"
          >
            <Input.TextArea rows={5} />
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
export default PublicPartnerForm;
