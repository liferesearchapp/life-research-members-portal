//This is a form component that allows the user to edit public information of a supervision.

import React, { FC, useContext, useState, useCallback, useEffect } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { useForm } from "antd/lib/form/Form";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import TextArea from "antd/lib/input/TextArea";
import Button from "antd/lib/button";
import Select from "antd/lib/select";
import DatePicker from "antd/lib/date-picker";
import type { Dayjs } from "dayjs";
import { FacultiesCtx } from "../../services/context/faculties-ctx";
import { LevelsCtx } from "../../services/context/levels-ctx";
import Divider from "antd/lib/divider";
import Notification from "../../services/notifications/notification";
import {
  SaveChangesCtx,
  useResetDirtyOnUnmount,
} from "../../services/context/save-changes-ctx";
import type {
  MemberPublicInfo,
  SupervisionPrivateInfo,
  SupervisionPublicInfo,
} from "../../services/_types";
import GetLanguage from "../../utils/front-end/get-language";
import updateSupervisionPublic from "../../services/update-supervision-public";
import type { UpdateSupervisionPublicParams } from "../../pages/api/update-supervision/[id]/public";
import MemberSelector from "../members/member-selector";
import toDayjsDate from "../../utils/front-end/to-dayjs-date";

const { Option } = Select;

type Props = {
  supervision: SupervisionPublicInfo;
  onSuccess: (supervision: SupervisionPrivateInfo) => void;
};

type SupervisionTrainee = {
  member: {
    id: number;
    account: {
      first_name: string;
      last_name: string;
    };
  };
};

type SupervisionSupervisor = {
  member: {
    id: number;
    account: {
      first_name: string;
      last_name: string;
    };
  };
};

type SupervisionCoSupervisor = {
  member: {
    id: number;
    account: {
      first_name: string;
      last_name: string;
    };
  };
};

type SupervisionCommittee = {
  member: {
    id: number;
    account: {
      first_name: string;
      last_name: string;
    };
  };
};

type SupervisionData = {
  last_name: string;
  first_name: string;
  start_date: Dayjs | null;
  end_date: Dayjs | null;
  faculty_id: number;
  level_id: number;
  note: string;
  membersTrainee: Map<number, MemberPublicInfo>;
  membersSupervisor: Map<number, MemberPublicInfo>;
  membersCoSupervisor: Map<number, MemberPublicInfo>;
  membersCommittee: Map<number, MemberPublicInfo>;
};

const PublicSupervisionForm: FC<Props> = ({ supervision, onSuccess }) => {
  const { en } = useContext(LanguageCtx);
  const [form] = useForm<SupervisionData>();
  const [loading, setLoading] = useState(false);
  const { faculties } = useContext(FacultiesCtx);
  const { levels } = useContext(LevelsCtx);
  const { dirty, setDirty, setSubmit } = useContext(SaveChangesCtx);
  useResetDirtyOnUnmount();

  const diffTrainee = useCallback(
    (
      newMembers: Map<number, MemberPublicInfo>
    ): {
      deleteTraineeMembers: number[];
      addTraineeMembers: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteTraineeMembers: number[] = [];
      const addTraineeMembers: number[] = [];
      for (const supervision_trainee of supervision.supervision_trainee)
        oldIds.add(supervision_trainee.member.id);
      for (const member of newMembers.values()) newIds.add(member.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteTraineeMembers.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addTraineeMembers.push(newId);
      return { deleteTraineeMembers, addTraineeMembers };
    },
    [supervision.supervision_trainee]
  );

  const diffPrincipalSupervisor = useCallback(
    (
      newMembers: Map<number, MemberPublicInfo>
    ): {
      deleteSupervisorMembers: number[];
      addSupervisorMembers: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteSupervisorMembers: number[] = [];
      const addSupervisorMembers: number[] = [];
      for (const supervision_principal_supervisor of supervision.supervision_principal_supervisor)
        oldIds.add(supervision_principal_supervisor.member.id);
      for (const member of newMembers.values()) newIds.add(member.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteSupervisorMembers.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addSupervisorMembers.push(newId);
      return { deleteSupervisorMembers, addSupervisorMembers };
    },
    [supervision.supervision_principal_supervisor]
  );

  const diffCommittee = useCallback(
    (
      newMembers: Map<number, MemberPublicInfo>
    ): {
      deleteCommitteeMembers: number[];
      addCommitteeMembers: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteCommitteeMembers: number[] = [];
      const addCommitteeMembers: number[] = [];
      for (const supervision_committee of supervision.supervision_committee)
        oldIds.add(supervision_committee.member.id);
      for (const member of newMembers.values()) newIds.add(member.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteCommitteeMembers.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addCommitteeMembers.push(newId);
      return { deleteCommitteeMembers, addCommitteeMembers };
    },
    [supervision.supervision_committee]
  );

  const diffCoSupervisor = useCallback(
    (
      newMembers: Map<number, MemberPublicInfo>
    ): {
      deleteCoSupervisorMembers: number[];
      addCoSupervisorMembers: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteCoSupervisorMembers: number[] = [];
      const addCoSupervisorMembers: number[] = [];
      for (const supervision_co_supervisor of supervision.supervision_co_supervisor)
        oldIds.add(supervision_co_supervisor.member.id);
      for (const member of newMembers.values()) newIds.add(member.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteCoSupervisorMembers.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addCoSupervisorMembers.push(newId);
      return { deleteCoSupervisorMembers, addCoSupervisorMembers };
    },
    [supervision.supervision_co_supervisor]
  );

  // Add your custom logic to submit the validated data
  const submitValidated = useCallback(
    async (data: SupervisionData): Promise<boolean> => {
      if (!dirty) {
        new Notification().warning(en ? "No Changes" : "Aucun changement");
        return true;
      }
      setLoading(true);

      const { addTraineeMembers, deleteTraineeMembers } = diffTrainee(
        data.membersTrainee
      );

      const { addSupervisorMembers, deleteSupervisorMembers } =
        diffPrincipalSupervisor(data.membersSupervisor);

      const { addCommitteeMembers, deleteCommitteeMembers } = diffCommittee(
        data.membersCommittee
      );

      const { addCoSupervisorMembers, deleteCoSupervisorMembers } =
        diffCoSupervisor(data.membersCoSupervisor);

      const params: UpdateSupervisionPublicParams = {
        last_name: data.last_name,
        first_name: data.first_name,
        start_date: data.start_date?.toISOString() || null,
        end_date: data.end_date?.toISOString() || null,
        faculty_id: data.faculty_id,
        level_id: data.level_id,
        note: data.note || "",
        addTraineeMembers,
        deleteTraineeMembers,
        addSupervisorMembers,
        deleteSupervisorMembers,
        addCommitteeMembers,
        deleteCommitteeMembers,
        addCoSupervisorMembers,
        deleteCoSupervisorMembers,
      };

      const updatedSupervision = await updateSupervisionPublic(
        supervision.id,
        params
      );
      setLoading(false);
      if (updatedSupervision) {
        setDirty(false);
        onSuccess(updatedSupervision);
      }
      return !!updatedSupervision;
    },
    [
      onSuccess,
      supervision.id,
      dirty,
      en,
      diffTrainee,
      diffPrincipalSupervisor,
      diffCommittee,
      diffCoSupervisor,
      setDirty,
    ]
  );

  // When called from context - need to validate manually
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

  // Pass submit function to context
  useEffect(() => {
    setSubmit(() => validateAndSubmit);
  }, [setSubmit, validateAndSubmit]);

  function getInitialSupervisorMembers(
    supervision_principal_supervisor: SupervisionSupervisor[]
  ) {
    const initialSupervisorMembers = new Map(
      supervision_principal_supervisor.map((k) => [
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
    return initialSupervisorMembers;
  }

  function getInitialCommitteeMembers(
    supervision_committee: SupervisionCommittee[]
  ) {
    const initialCommitteeMembers = new Map(
      supervision_committee.map((k) => [
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
    return initialCommitteeMembers;
  }

  function getInitialCoSupervisorMembers(
    supervision_co_supervisor: SupervisionCoSupervisor[]
  ) {
    const initialCoSupervisorMembers = new Map(
      supervision_co_supervisor.map((k) => [
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
    return initialCoSupervisorMembers;
  }

  function getInitialTraineeMembers(supervision_trainee: SupervisionTrainee[]) {
    const initialTraineeMembers = new Map(
      supervision_trainee.map((k) => [
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
    return initialTraineeMembers;
  }

  const initialValues: SupervisionData = {
    last_name: supervision.last_name,
    first_name: supervision.first_name,
    start_date: toDayjsDate(supervision.start_date),
    end_date: toDayjsDate(supervision.end_date),
    faculty_id: supervision.faculty_id || 0,
    level_id: supervision.level_id || 0,
    note: supervision.note || "",
    // @ts-ignore
    membersSupervisor: getInitialSupervisorMembers(
      supervision.supervision_principal_supervisor
    ),
    // @ts-ignore
    membersCommittee: getInitialCommitteeMembers(
      supervision.supervision_committee
    ),
    // @ts-ignore
    membersCoSupervisor: getInitialCoSupervisorMembers(
      supervision.supervision_co_supervisor
    ),
    // @ts-ignore
    membersTrainee: getInitialTraineeMembers(supervision.supervision_trainee),
  };

  return (
    <div className="public-supervision-form-container">
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="public-supervision-form"
        onValuesChange={() => setDirty(true)}
      >
        <Form.Item
          label={en ? "First Name" : "Prénom"}
          name="first_name"
          rules={[
            {
              required: true,
              message: en
                ? "Please input the first name!"
                : "Veuillez saisir le prénom !",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "Last Name" : "Nom"}
          name="last_name"
          rules={[
            {
              required: true,
              message: en
                ? "Please input the last name!"
                : "Veuillez saisir le nom !",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <label htmlFor="membersTrainee">
          {en ? "Trainee" : "Supervisé(e)"}
        </label>
        <Form.Item name="membersTrainee">
          <MemberSelector
            setErrors={(e) =>
              form.setFields([{ name: "membersTrainee", errors: e }])
            }
          />
        </Form.Item>

        <Form.Item
          label={en ? "Start Date" : "Date de début"}
          name="start_date"
        >
          <DatePicker />
        </Form.Item>

        <Form.Item label={en ? "End Date" : "Date de fin"} name="end_date">
          <DatePicker />
        </Form.Item>

        <Form.Item
          label={en ? "Faculty" : "Faculté"}
          name="faculty_id"
          rules={[
            {
              required: true,
              message: en
                ? "Please select the faculty!"
                : "Veuillez sélectionner la faculté !",
            },
          ]}
        >
          <Select>
            <Option value="">{""}</Option>
            {faculties.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={en ? "Level" : "Niveau"}
          name="level_id"
          rules={[
            {
              required: true,
              message: en
                ? "Please select the level!"
                : "Veuillez sélectionner le niveau !",
            },
          ]}
        >
          <Select>
            <Option value="">{""}</Option>
            {/* Replace levels with your actual levels data */}
            {levels.map((l) => (
              <Option key={l.id} value={l.id}>
                <GetLanguage obj={l} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <label htmlFor="membersSupervisor">
          {en ? "Principal Supervisor" : "Superviseur(e) principal(e)"}
        </label>
        <Form.Item name="membersSupervisor">
          <MemberSelector
            setErrors={(e) =>
              form.setFields([{ name: "membersSupervisor", errors: e }])
            }
          />
        </Form.Item>

        <label htmlFor="membersCoSupervisor">
          {en ? "Co-Supervisors" : "Co-superviseur(e)s"}
        </label>
        <Form.Item name="membersCoSupervisor">
          <MemberSelector
            setErrors={(e) =>
              form.setFields([{ name: "membersCoSupervisor", errors: e }])
            }
          />
        </Form.Item>

        <label htmlFor="membersCommittee">
          {en ? "Committee Members" : "Membres du comité"}
        </label>
        <Form.Item name="membersCommittee">
          <MemberSelector
            setErrors={(e) =>
              form.setFields([{ name: "membersCommittee", errors: e }])
            }
          />
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

export default PublicSupervisionForm;
