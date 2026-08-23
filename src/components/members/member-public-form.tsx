import Button from "antd/lib/button";
import Form from "antd/lib/form";
import { useForm } from "antd/lib/form/Form";
import Input from "antd/lib/input";
import React, {
  FC,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  MemberPrivateInfo,
  ProblemInfo,
  MemberPublicInfo,
} from "../../services/_types";
import updateMemberPublic from "../../services/update-member-public";
import type { keyword, problem } from "@prisma/client";
import { LanguageCtx } from "../../services/context/language-ctx";
import Select from "antd/lib/select";
import TextArea from "antd/lib/input/TextArea";
import { FacultiesCtx } from "../../services/context/faculties-ctx";
import { MemberTypesCtx } from "../../services/context/member-types-ctx";
import GetLanguage from "../../utils/front-end/get-language";
import Divider from "antd/lib/divider";
import type { UpdateMemberPublicParams } from "../../pages/api/update-member/[id]/public";
import Text from "antd/lib/typography/Text";
import type { organization, supervision } from "@prisma/client";

import KeywordSelector from "../keywords/keyword-selector";
import Notification from "../../services/notifications/notification";
import {
  SaveChangesCtx,
  useResetDirtyOnUnmount,
} from "../../services/context/save-changes-ctx";
import PartnerSelector from "../partners/partner-selector";
import { useAdminDetails } from "../../services/context/selected-institute-ctx";

const { Option } = Select;

type Props = {
  member: MemberPublicInfo;
  onSuccess: (member: MemberPrivateInfo) => void;
};

type Data = {
  first_name: string;
  last_name: string;
  about_me_en: string;
  about_me_fr: string;
  faculty_id?: number;
  type_id?: number;
  problems: ProblemInfo[];
  keywords: Map<number, keyword>;
  work_email: string;
  work_phone: string;
  website_link: string;
  twitter_link: string;
  linkedin_link: string;
  cv_link: string;
  facebook_link: string;
  tiktok_link: string;
  organizations: Map<number, organization>;
};

const PublicMemberForm: FC<Props> = ({ member, onSuccess }) => {
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const { memberTypes } = useContext(MemberTypesCtx);
  const { faculties } = useContext(FacultiesCtx);
  const [loading, setLoading] = useState(false);
  const { dirty, setDirty, setSubmit } = useContext(SaveChangesCtx);
  const isAdmin = useAdminDetails();
  useResetDirtyOnUnmount();

  const diffProblems = useCallback(
    (
      newProblems: ProblemInfo[]
    ): {
      addProblems: ProblemInfo[];
      deleteProblems: number[];
    } => {
      const oldProblems = member.problem;
      const addProblems = [];
      const deleteProblems = [];
      for (const [i, newP] of newProblems.entries()) {
        const oldP = oldProblems[i] as problem | undefined;
        const different =
          oldP?.name_en !== newP.name_en || oldP?.name_fr !== newP.name_fr;
        const hasName = newP.name_en || newP.name_fr;
        if (different) {
          if (oldP) deleteProblems.push(oldP.id);
          if (hasName) addProblems.push(newP);
        }
      }
      return { addProblems, deleteProblems };
    },
    [member.problem]
  );

  const diffKeywords = useCallback(
    (
      newKeywords: Map<number, keyword>
    ): {
      deleteKeywords: number[];
      addKeywords: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteKeywords: number[] = [];
      const addKeywords: number[] = [];
      for (const has_keyword of member.has_keyword)
        oldIds.add(has_keyword.keyword.id);
      for (const keyword of newKeywords.values()) newIds.add(keyword.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteKeywords.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addKeywords.push(newId);
      return { deleteKeywords, addKeywords };
    },
    [member.has_keyword]
  );

  const diffPartners = useCallback(
    (
      newPartners: Map<number, organization>
    ): {
      deletePartners: number[];
      addPartners: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deletePartners: number[] = [];
      const addPartners: number[] = [];
      for (const partnership_member_org of member.partnership_member_org)
        oldIds.add(partnership_member_org.organization.id);
      for (const organization of newPartners.values())
        newIds.add(organization.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deletePartners.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addPartners.push(newId);
      return { deletePartners, addPartners };
    },
    [member.partnership_member_org]
  );

  /** Submits validated data */
  const submitValidated = useCallback(
    async (data: Data): Promise<boolean> => {
      if (!dirty) {
        new Notification().warning(en ? "No Changes" : "Aucun changement");
        return true;
      }
      setLoading(true);
      const { addProblems, deleteProblems } = diffProblems(data.problems);
      const { addKeywords, deleteKeywords } = diffKeywords(data.keywords);
      const { addPartners, deletePartners } = diffPartners(data.organizations);

      const params: UpdateMemberPublicParams = {
        first_name: data.first_name,
        last_name: data.last_name,
        about_me_en: data.about_me_en,
        about_me_fr: data.about_me_fr,
        faculty_id: data.faculty_id || null,
        type_id: data.type_id || null,
        work_email: data.work_email,
        work_phone: data.work_phone,
        website_link: data.website_link,
        twitter_link: data.twitter_link,
        linkedin_link: data.linkedin_link,
        cv_link: data.cv_link,
        facebook_link: data.facebook_link,
        tiktok_link: data.tiktok_link,
        deleteProblems,
        addProblems,
        deleteKeywords,
        addKeywords,
        deletePartners,
        addPartners,
      };
      const newInfo = await updateMemberPublic(member.id, params);
      setLoading(false);
      if (newInfo) {
        setDirty(false);
        onSuccess(newInfo);
      }
      return !!newInfo;
    },
    [
      onSuccess,
      diffKeywords,
      diffProblems,
      diffPartners,

      member.id,
      dirty,
      en,
      setDirty,
    ]
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

  function getInitialProblems() {
    const problems: ProblemInfo[] = [];
    for (const i of [0, 1, 2]) {
      const problem = member.problem[i] as problem | undefined;
      problems[i] = {
        name_en: problem?.name_en || "",
        name_fr: problem?.name_fr || "",
      };
    }
    return problems;
  }

  function getInitialKeywords() {
    return new Map(member.has_keyword.map((k) => [k.keyword.id, k.keyword]));
  }

  function getInitialPartners() {
    return new Map(
      member.partnership_member_org.map((k) => [
        k.organization.id,
        k.organization,
      ])
    );
  }

  const initialValues: Data = {
    first_name: member.account.first_name,
    last_name: member.account.last_name,
    about_me_en: member.about_me_en || "",
    about_me_fr: member.about_me_fr || "",
    faculty_id: member.faculty?.id,
    type_id: member.member_type?.id,
    work_email: member.work_email || "",
    work_phone: member.work_phone || "",
    website_link: member.website_link || "",
    twitter_link: member.twitter_link || "",
    linkedin_link: member.linkedin_link || "",
    cv_link: member.cv_link || "",
    facebook_link: member.facebook_link || "",
    tiktok_link: member.tiktok_link || "",
    organizations: getInitialPartners(),

    problems: getInitialProblems(),
    keywords: getInitialKeywords(),
  };

  return (
    <div className="public-member-form-container">
      <Text strong>
        {en
          ? "Let everyone know what you do! You are encouraged to provide both languages where applicable, but it is not required."
          : "Faites savoir à tout le monde ce que vous faites ! Vous êtes encouragé à fournir les deux langues, le cas échéant, mais ce n'est pas obligatoire."}
      </Text>
      <Divider />
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="public-member-form"
        onValuesChange={() => setDirty(true)}
      >
        <div className="row">
          <Form.Item
            label={en ? "First Name" : "Prénom"}
            name="first_name"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={en ? "Last Name" : "Nom de Famille"}
            name="last_name"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input />
          </Form.Item>
          {isAdmin && (<Form.Item
            label={en ? "Member Type" : "Type de Membre"}
            name="type_id"
          >
            <Select>
              <Option value="">{""}</Option>
              {memberTypes.map((f) => (
                <Option key={f.id} value={f.id}>
                  <GetLanguage obj={f} />
                </Option>
              ))}
            </Select>
          </Form.Item>
          )}
          <Form.Item
            className="faculty"
            label={en ? "Faculty" : "Faculté"}
            name="faculty_id"
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
            label={en ? "Work Email" : "Email de Travail"}
            name="work_email"
            rules={[
              {
                type: "email",
                message: en ? "Invalid Email" : "Email Invalide",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={en ? "Work Phone" : "Téléphone de Travail"}
            name="work_phone"
          >
            <Input type="tel" />
          </Form.Item>
        </div>

        <Divider />
        <div className="row">
          <Form.Item
            label={en ? "About Me (English)" : "À Propos de Moi (Anglais)"}
            name="about_me_en"
          >
            <TextArea rows={4} spellCheck="false" />
          </Form.Item>

          <Form.Item
            label={en ? "About Me (French)" : "À Propos de Moi (Français)"}
            name="about_me_fr"
          >
            <TextArea rows={4} spellCheck="false" />
          </Form.Item>
        </div>

        <label htmlFor="problems">
          {en ? "Problems I Work On" : "Problèmes sur Lesquels Je Travaille"}
        </label>
        <Divider />
        <Form.List name="problems">
          {(fields) =>
            fields.map((field) => (
              <Fragment key={field.key}>
                <div className="row">
                  <Form.Item
                    name={[field.name, "name_en"]}
                    label={
                      en
                        ? "Problem " + (field.name + 1) + " (English)"
                        : "Problème " + (field.name + 1) + " (Anglais)"
                    }
                  >
                    <TextArea rows={1} spellCheck="false" />
                  </Form.Item>

                  <Form.Item
                    key={field.key}
                    name={[field.name, "name_fr"]}
                    label={
                      en
                        ? "Problem " + (field.name + 1) + " (French)"
                        : "Problème " + (field.name + 1) + " (Français)"
                    }
                  >
                    <TextArea rows={1} spellCheck="false" />
                  </Form.Item>
                </div>
                <Divider />
              </Fragment>
            ))
          }
        </Form.List>

        <label htmlFor="keywords">{en ? "Keywords" : "Mots Clés"}</label>
        <Divider />
        <Form.Item name="keywords">
          <KeywordSelector
            setErrors={(e) => form.setFields([{ name: "keywords", errors: e }])}
          />
        </Form.Item>
        <label htmlFor="keywords">
          {en ? "Member's Partners" : "Partenaires du membre"}
        </label>
        <Divider />
        <Form.Item name="organizations">
          <PartnerSelector
            setErrors={(e) =>
              form.setFields([{ name: "organizations", errors: e }])
            }
          />
        </Form.Item>

        <Divider />

        <label>{en ? "External Links" : "Liens externes"}</label>
        <Divider />
        <div className="row">
          <Form.Item
            label={en ? "Your CV" : "Votre CV"}
            name="cv_link"
            rules={[
              { type: "url", message: en ? "Invalid URL" : "URL invalide" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={en ? "Personal Website" : "Site Web personnel"}
            name="website_link"
            rules={[
              { type: "url", message: en ? "Invalid URL" : "URL invalide" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="LinkedIn"
            name="linkedin_link"
            rules={[
              { type: "url", message: en ? "Invalid URL" : "URL invalide" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Twitter"
            name="twitter_link"
            rules={[
              { type: "url", message: en ? "Invalid URL" : "URL invalide" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Facebook"
            name="facebook_link"
            rules={[
              { type: "url", message: en ? "Invalid URL" : "URL invalide" },
            ]}
          >
            <Input />
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

export default PublicMemberForm;
