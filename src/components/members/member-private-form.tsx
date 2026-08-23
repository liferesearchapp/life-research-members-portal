import Button from "antd/lib/button";
import Form from "antd/lib/form";
import { useForm } from "antd/lib/form/Form";
import Input from "antd/lib/input";
import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import type { MemberPrivateInfo } from "../../services/_types";
import { LanguageCtx } from "../../services/context/language-ctx";
import Divider from "antd/lib/divider";
import Text from "antd/lib/typography/Text";
import type { UpdateMemberPrivateParams } from "../../pages/api/update-member/[id]/private";
import updateMemberPrivate from "../../services/update-member-private";
import DatePicker from "antd/lib/date-picker";
import type { Dayjs } from "dayjs";
import { red } from "@ant-design/colors";
import Switch from "antd/lib/switch";
import Notification from "../../services/notifications/notification";
import { SaveChangesCtx, useResetDirtyOnUnmount } from "../../services/context/save-changes-ctx";
import toDayjsDate from "../../utils/front-end/to-dayjs-date";

type Props = {
  member: MemberPrivateInfo;
  onSuccess: (member: MemberPrivateInfo) => void;
};

type Data = {
  address: string;
  city: string;
  province: string;
  country: string;
  postal_code: string;
  mobile_phone: string;
  date_joined: Dayjs | null;
  is_active: boolean;
};

const PrivateMemberForm: FC<Props> = ({ member, onSuccess }) => {
  // This sets the return type of the form
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(member.is_active);
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
      const activate = !member.is_active && data.is_active;
      const deactivate = member.is_active && !data.is_active;
      const params: UpdateMemberPrivateParams = {
        address: data.address,
        city: data.city,
        province: data.province,
        country: data.country,
        postal_code: data.postal_code,
        mobile_phone: data.mobile_phone,
        date_joined: data.date_joined?.toISOString() || null,
        activate,
        deactivate,
      };
      const newInfo = await updateMemberPrivate(member.id, params);
      setLoading(false);
      if (newInfo) {
        setDirty(false);
        onSuccess(newInfo);
      }
      return !!newInfo;
    },
    [dirty, en, member.id, member.is_active, onSuccess, setDirty]
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
    address: member.address || "",
    city: member.city || "",
    province: member.province || "",
    country: member.country || "",
    postal_code: member.postal_code || "",
    mobile_phone: member.mobile_phone || "",
    date_joined: toDayjsDate(member.date_joined),
    is_active: member.is_active,
  };

  return (
    <div className="private-member-form-container">
      <Text strong>
        {en
          ? "This information will only be seen by administrators."
          : "Ces informations ne seront visibles que par les administrateurs."}
      </Text>
      <Divider />
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="private-member-form"
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
                ? "Your public profile will be hidden"
                : "Votre profil public sera caché"}
            </Text>
          }
        >
          <Switch />
        </Form.Item>

        <div className="row">
          <Form.Item label={en ? "Address" : "Adresse"} name="address" className="address">
            <Input />
          </Form.Item>
          <Form.Item label={en ? "City" : "Ville"} name="city" className="city">
            <Input />
          </Form.Item>
          <Form.Item label={en ? "Province" : "Province"} name="province" className="province">
            <Input />
          </Form.Item>
          <Form.Item label={en ? "Country" : "Pays"} name="country" className="country">
            <Input />
          </Form.Item>
          <Form.Item
            label={en ? "Postal Code" : "Code postal"}
            name="postal_code"
            className="postal-code"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={en ? "Mobile Phone" : "Téléphone mobile"}
            name="mobile_phone"
            className="mobile-phone"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={en ? "Date Joined" : "Date d'inscription"}
            name="date_joined"
            className="date-picker"
          >
            <DatePicker />
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

export default PrivateMemberForm;
