/**
PublicGrantForm component displays a form for updating public information of a grant.
The form allows users to update the title, amount, status, source, topic, and notes of the grant.
Additionally, it also allows users to associate investigators and members involved with the grant.
*/

import React, { FC, useContext, useState, useCallback, useEffect } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { Moment } from "moment";

import Notification from "../../services/notifications/notification";
import {
  SaveChangesCtx,
  useResetDirtyOnUnmount,
} from "../../services/context/save-changes-ctx";
import type {
  GrantPrivateInfo,
  GrantPublicInfo,
  MemberPublicInfo,
} from "../../services/_types";
import { GrantSourcesCtx } from "../../services/context/grant-sources-ctx";
import { GrantStatusCtx } from "../../services/context/grant-statuses-ctx";
import { AllTopicsCtx } from "../../services/context/all-topics-ctx";
import type { UpdateGrantPublicParams } from "../../pages/api/update-grant/[id]/public";
import updateGrantPublic from "../../services/update-grant-public";
import moment from "moment";
import GetLanguage from "../../utils/front-end/get-language";
import { Switch, Form, Input, Button, Select, DatePicker, Divider } from "antd";
import MemberSelector from "../members/member-selector";
const { useForm } = Form;
const TextArea = Input.TextArea;

const { Option } = Select;

type Props = {
  grant: GrantPublicInfo;
  onSuccess: (grant: GrantPrivateInfo) => void;
};

type GrantInvestigator = {
  member: {
    id: number;
    account: {
      first_name: string;
      last_name: string;
    };
  };
};

type GrantMemberInvolved = {
  member: {
    id: number;
    account: {
      first_name: string;
      last_name: string;
    };
  };
};

type GrantData = {
  title: string;
  amount: string;
  status_id: number;
  throught_lri: boolean;
  submission_date: Moment | null;
  obtained_date: Moment | null;
  completed_date: Moment | null;
  source_id: number;
  all_investigator: string;
  topic_id: number;
  note: string;
  membersInvestigator: Map<number, MemberPublicInfo>;
  membersInvolved: Map<number, MemberPublicInfo>;
};

const PublicGrantForm: FC<Props> = ({ grant, onSuccess }) => {
  const { en } = useContext(LanguageCtx);
  const [form] = useForm<GrantData>();
  const { grantSources } = useContext(GrantSourcesCtx);
  const { grantStatuses } = useContext(GrantStatusCtx);
  const { topics } = useContext(AllTopicsCtx);
  const [loading, setLoading] = useState(false);
  const [througth_lri_status, setThroughtLRI] = useState(false);
  const { dirty, setDirty, setSubmit } = useContext(SaveChangesCtx);
  useResetDirtyOnUnmount();

  const diffInvestigator = useCallback(
    (
      newMembers: Map<number, MemberPublicInfo>
    ): {
      deleteInvestigatorMembers: number[];
      addInvestigatorMembers: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteInvestigatorMembers: number[] = [];
      const addInvestigatorMembers: number[] = [];
      for (const grant_investigator_member of grant.grant_investigator_member)
        oldIds.add(grant_investigator_member.member.id);
      for (const member of newMembers.values()) newIds.add(member.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteInvestigatorMembers.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addInvestigatorMembers.push(newId);
      return { deleteInvestigatorMembers, addInvestigatorMembers };
    },
    [grant.grant_investigator_member]
  );

  const diffInvolved = useCallback(
    (
      newMembers: Map<number, MemberPublicInfo>
    ): {
      deleteInvolvedMembers: number[];
      addInvolvedMembers: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteInvolvedMembers: number[] = [];
      const addInvolvedMembers: number[] = [];
      for (const grant_member_involved of grant.grant_member_involved)
        oldIds.add(grant_member_involved.member.id);
      for (const member of newMembers.values()) newIds.add(member.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteInvolvedMembers.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addInvolvedMembers.push(newId);
      return { deleteInvolvedMembers, addInvolvedMembers };
    },
    [grant.grant_member_involved]
  );

  const submitValidated = useCallback(
    async (data: GrantData): Promise<boolean> => {
      if (!dirty) {
        new Notification().warning(en ? "No Changes" : "Aucun changement");
        return true;
      }
      setLoading(true);

      const { deleteInvestigatorMembers, addInvestigatorMembers } =
        diffInvestigator(data.membersInvestigator);

      const { deleteInvolvedMembers, addInvolvedMembers } = diffInvolved(
        data.membersInvolved
      );

      const params: UpdateGrantPublicParams = {
        title: data.title,
        amount: parseFloat(data.amount),
        status_id: data.status_id,
        throught_lri: data.throught_lri,
        submission_date: data.submission_date?.toISOString() || null,
        obtained_date: data.obtained_date?.toISOString() || null,
        completed_date: data.completed_date?.toISOString() || null,
        source_id: data.source_id,
        all_investigator: data.all_investigator,
        topic_id: data.topic_id,
        note: data.note || "",
        deleteInvestigatorMembers,
        addInvestigatorMembers,
        deleteInvolvedMembers,
        addInvolvedMembers,
      };

      const updatedGrant = await updateGrantPublic(grant.id, params);

      setLoading(false);
      if (updatedGrant) {
        setDirty(false);
        onSuccess(updatedGrant);
      }
      return !!updatedGrant;
    },
    [onSuccess, grant.id, dirty, en, diffInvestigator, diffInvolved, setDirty]
  );
  /** When called from context - need to validate manually */

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

  /** Pass submit function to context */
  useEffect(() => {
    setSubmit(() => validateAndSubmit);
  }, [setSubmit, validateAndSubmit]);

  function onChange(changed: any, data: GrantData) {
    setDirty(true);

    if (througth_lri_status !== data.throught_lri) {
      setThroughtLRI(data.throught_lri);
    }
  }

  function getInitialInvestigatorMembers(
    grant_investigator_member: GrantInvestigator[]
  ) {
    const initialInvestigatorMembers = new Map(
      grant_investigator_member.map((k) => [
        k.member.id,
        {
          id: k.member.id,
          account: {
            first_name: k.member.account.first_name,
            last_name: k.member.account.last_name,
          },
        },
      ])
    );
    return initialInvestigatorMembers;
  }

  function getInitialInvolvedMembers(
    grant_member_involved: GrantMemberInvolved[]
  ) {
    const initialInvolvedMembers = new Map(
      grant_member_involved.map((k) => [
        k.member.id,
        {
          id: k.member.id,
          account: {
            first_name: k.member.account.first_name,
            last_name: k.member.account.last_name,
          },
        },
      ])
    );
    return initialInvolvedMembers;
  }

  const initialValues: GrantData = {
    title: grant.title,
    amount: grant.amount.toString(),
    status_id: grant.status?.id || 0,
    throught_lri: grant.throught_lri,
    submission_date: grant.submission_date
      ? moment(
          grant.submission_date instanceof Date
            ? grant.submission_date.toISOString().split("T")[0]
            : (grant.submission_date as string).split("T")[0]
        )
      : null,
    obtained_date: grant.obtained_date
      ? moment(
          grant.obtained_date instanceof Date
            ? grant.obtained_date.toISOString().split("T")[0]
            : (grant.obtained_date as string).split("T")[0]
        )
      : null,
    completed_date: grant.completed_date
      ? moment(
          grant.completed_date instanceof Date
            ? grant.completed_date.toISOString().split("T")[0]
            : (grant.completed_date as string).split("T")[0]
        )
      : null,
    source_id: grant.source?.id || 0,
    all_investigator: grant.all_investigator || "",
    topic_id: grant.topic?.id || 0,
    note: grant.note || "",
    // @ts-ignore
    membersInvestigator: getInitialInvestigatorMembers(
      grant.grant_investigator_member
    ),
    // @ts-ignore
    membersInvolved: getInitialInvolvedMembers(grant.grant_member_involved),
  };

  return (
    <div className="public-grant-form-container">
      <Divider />
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="public-grant-form"
        onValuesChange={() => setDirty(true)}
      >
        <Form.Item
          label={en ? "Title" : "Titre"}
          name="title"
          rules={[
            {
              required: true,
              message: en
                ? "Please input the grant title!"
                : "Veuillez saisir le titre de la subvention !",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={en ? "Amount" : "Montant"}
          name="amount"
          rules={[
            {
              required: true,
              message: en
                ? "Please input the grant amount!"
                : "Veuillez saisir le montant de la subvention !",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="throught_lri"
          valuePropName="checked"
          label={
            througth_lri_status
              ? en
                ? "Throught LRI	: Yes"
                : "Via IRL : Oui"
              : en
              ? "Throught LRI	: No"
              : "Via IRL : Non"
          }
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={en ? "Status" : "Statut"}
          name="status_id"
          rules={[
            {
              required: true,
              message: en
                ? "Please select the grant status!"
                : "Veuillez sélectionner le statut de la subvention !",
            },
          ]}
        >
          <Select>
            <Option value="">{""}</Option>
            {grantStatuses.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={en ? "Submission Date" : "Date de soumission"}
          name="submission_date"
        >
          <DatePicker />
        </Form.Item>

        <Form.Item
          label={en ? "Obtained Date" : "Date d'obtention"}
          name="obtained_date"
        >
          <DatePicker />
        </Form.Item>

        <Form.Item
          label={en ? "Completed Date" : "Date de clôture"}
          name="completed_date"
        >
          <DatePicker />
        </Form.Item>
        <Form.Item
          label={en ? "Source" : "Source"}
          name="source_id"
          rules={[
            {
              required: true,
              message: en
                ? "Please select the grant source!"
                : "Veuillez sélectionner la source de la subvention !",
            },
          ]}
        >
          <Select>
            <Option value="">{""}</Option>
            {grantSources.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={en ? "All Investigators" : "Tous les chercheurs"}
          name="all_investigator"
          rules={[
            {
              required: true,
              message: en
                ? "Please input all investigators!"
                : "Veuillez saisir tous les chercheurs !",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <label htmlFor="membersInvestigator">
          {en ? "Grant Investigator Member" : "Membre chercheur"}
        </label>
        <Form.Item name="membersInvestigator">
          <MemberSelector
            setErrors={(e) =>
              form.setFields([{ name: "membersInvestigator", errors: e }])
            }
          />
        </Form.Item>

        <label htmlFor="membersInvolved">
          {en ? "Grant Member Involved" : "Membre impliqué"}
        </label>
        <Form.Item name="membersInvolved">
          <MemberSelector
            setErrors={(e) =>
              form.setFields([{ name: "membersInvolved", errors: e }])
            }
          />
        </Form.Item>

        <Form.Item
          label={en ? "Topic" : "Sujet"}
          name="topic_id"
          rules={[
            {
              required: true,
              message: en
                ? "Please select the grant topic!"
                : "Veuillez sélectionner le sujet de la subvention !",
            },
          ]}
        >
          <Select>
            <Option value="">{""}</Option>
            {topics.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={en ? "Note" : "Note"} name="note">
          <TextArea />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {en ? "Submit" : "Soumettre"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default PublicGrantForm;
