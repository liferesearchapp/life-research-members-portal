import Button from "antd/lib/button";
import Form from "antd/lib/form";
import { useForm } from "antd/lib/form/Form";
import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import type { MemberPrivateInfo } from "../../services/_types";
import { LanguageCtx } from "../../services/context/language-ctx";
import TextArea from "antd/lib/input/TextArea";
import Divider from "antd/lib/divider";
import Text from "antd/lib/typography/Text";
import type { Dayjs } from "dayjs";
import type { UpdateMemberInsightParams } from "../../pages/api/update-member/[id]/insight";
import updateMemberInsight from "../../services/update-member-insight";
import DatePicker from "antd/lib/date-picker";
import Notification from "../../services/notifications/notification";
import { SaveChangesCtx, useResetDirtyOnUnmount } from "../../services/context/save-changes-ctx";
import toDayjsDate from "../../utils/front-end/to-dayjs-date";

type Props = {
  member: MemberPrivateInfo;
  onSuccess: (member: MemberPrivateInfo) => void;
};

type Data = {
  interview_date: Dayjs | null;
  about_member: string;
  about_promotions: string;
  dream: string;
  how_can_we_help: string;
  admin_notes: string;
  other_notes: string;
};

const MemberInsightForm: FC<Props> = ({ member, onSuccess }) => {
  // This sets the return type of the form
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const [loading, setLoading] = useState(false);
  const { dirty, setDirty, setSubmit } = useContext(SaveChangesCtx);
  useResetDirtyOnUnmount();
  const insight = member.insight;

  /** Submits validated data */
  const submitValidated = useCallback(
    async (data: Data): Promise<boolean> => {
      if (!dirty) {
        new Notification().warning(en ? "No changes" : "Aucun changement");
        return true;
      }
      setLoading(true);
      const params: UpdateMemberInsightParams = {
        interview_date: data.interview_date?.toISOString() || null,
        about_member: data.about_member,
        about_promotions: data.about_promotions,
        dream: data.dream,
        how_can_we_help: data.how_can_we_help,
        admin_notes: data.admin_notes,
        other_notes: data.other_notes,
      };
      const newInfo = await updateMemberInsight(member.id, params);
      setLoading(false);
      if (newInfo) {
        setDirty(false);
        onSuccess(newInfo);
      }
      return !!newInfo;
    },
    [dirty, member.id, en, setDirty, onSuccess]
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

  /** Pass submit function to parent */
  useEffect(() => {
    setSubmit(() => validateAndSubmit);
  }, [setSubmit, validateAndSubmit]);

  const initialValues: Data = {
    interview_date: toDayjsDate(insight?.interview_date),
    about_member: insight?.about_member || "",
    about_promotions: insight?.about_promotions || "",
    dream: insight?.dream || "",
    how_can_we_help: insight?.how_can_we_help || "",
    admin_notes: insight?.admin_notes || "",
    other_notes: insight?.other_notes || "",
  };

  return (
    <div className="member-insight-form-container">
      <Text strong>
        {en
          ? "The Institute is here to help; give us some insight into yourself."
          : "L'Institut est là pour vous aider; donnez-nous un aperçu de vous-même."}
      </Text>
      <Divider />
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="member-insight-form"
        onValuesChange={() => setDirty(true)}
      >
        <Form.Item label={en ? "Interview Date" : "Date de l'entretien"} name="interview_date">
          <DatePicker />
        </Form.Item>
        <div className="row">
          <Form.Item label={en ? "About Member" : "À propos du membre"} name="about_member">
            <TextArea spellCheck="false" />
          </Form.Item>

          <Form.Item
            label={en ? "About Promotions" : "À propos des promotions"}
            name="about_promotions"
          >
            <TextArea spellCheck="false" />
          </Form.Item>
        </div>
        <div className="row">
          <Form.Item label={en ? "Dream" : "Rêve"} name="dream">
            <TextArea spellCheck="false" />
          </Form.Item>

          <Form.Item
            label={en ? "How the Institute can help" : "Comment l'Institut peut vous aider"}
            name="how_can_we_help"
          >
            <TextArea spellCheck="false" />
          </Form.Item>
        </div>
        <div className="row">
          <Form.Item label={en ? "Admin Notes" : "Notes d'administration"} name="admin_notes">
            <TextArea spellCheck="false" />
          </Form.Item>

          <Form.Item label={en ? "Other Notes" : "Autres notes"} name="other_notes">
            <TextArea spellCheck="false" />
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

export default MemberInsightForm;
