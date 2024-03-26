//This component is a form used to edit the public information of a product.
//The component has various functions to compare the initial data of the product with the data entered in the form (`diffMembers`, `diffTargets`, and `diffPartners`).
//The component also has a `validateAndSubmit` function that can be called from the SaveChangesCtx context to validate and submit the form.

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
  ProductPublicInfo,
  ProductPrivateInfo,
} from "../../services/_types";
import updateProductPublic from "../../services/update-product-public";
import { LanguageCtx } from "../../services/context/language-ctx";
import Select from "antd/lib/select";
import TextArea from "antd/lib/input/TextArea";
import GetLanguage from "../../utils/front-end/get-language";
import Divider from "antd/lib/divider";
import type { UpdateProductPublicParams } from "../../pages/api/update-product/[id]/public";
import Text from "antd/lib/typography/Text";
import Notification from "../../services/notifications/notification";
import {
  SaveChangesCtx,
  useResetDirtyOnUnmount,
} from "../../services/context/save-changes-ctx";
import { ProductTypesCtx } from "../../services/context/products-types-ctx";
import moment, { Moment } from "moment";
import type { MemberPublicInfo } from "../../services/_types";
import DatePicker from "antd/lib/date-picker";
import type { target } from "@prisma/client";
import type { organization } from "@prisma/client";
import TargetSelector from "../targets/target-selector";
import PartnerSelector from "../partners/partner-selector";
import MemberSelector from "../members/member-selector";
import { MemberInstituteCtx } from "../../services/context/member-institutes-ctx";

const { Option } = Select;

type Props = {
  product: ProductPublicInfo;
  onSuccess: (product: ProductPrivateInfo) => void;
};

type ProductMemberAuthor = {
  member: {
    id: number;
    account: {
      first_name: string;
      last_name: string;
    };
  };
};

type Data = {
  title_en: string;
  title_fr: string;
  publish_date: Moment | null;
  all_author?: string;
  doi?: string;
  targets: Map<number, target>;
  organizations: Map<number, organization>;
  product_type_id?: number;
  note?: string;
  members: Map<number, MemberPublicInfo>;
  institutes: number[];
};

const PublicProductForm: FC<Props> = ({ product, onSuccess }) => {
  const { en } = useContext(LanguageCtx);
  const [form] = useForm<Data>();
  const { productTypes } = useContext(ProductTypesCtx);
  const [loading, setLoading] = useState(false);
  const { dirty, setDirty, setSubmit } = useContext(SaveChangesCtx);
  const { institutes } = useContext(MemberInstituteCtx);
  useResetDirtyOnUnmount();

  const diffMembers = useCallback(
    (
      newMembers: Map<number, MemberPublicInfo>
    ): {
      deleteMembers: number[];
      addMembers: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteMembers: number[] = [];
      const addMembers: number[] = [];
      for (const product_member_author of product.product_member_author)
        oldIds.add(product_member_author.member.id);
      for (const member of newMembers.values()) newIds.add(member.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteMembers.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addMembers.push(newId);
      return { deleteMembers, addMembers };
    },
    [product.product_member_author]
  );

  const diffTargets = useCallback(
    (
      newTargets: Map<number, target>
    ): {
      deleteTargets: number[];
      addTargets: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteTargets: number[] = [];
      const addTargets: number[] = [];
      for (const product_target of product.product_target)
        oldIds.add(product_target.target.id);
      for (const target of newTargets.values()) newIds.add(target.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteTargets.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addTargets.push(newId);
      return { deleteTargets, addTargets };
    },
    [product.product_target]
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
      for (const product_partnership of product.product_partnership)
        oldIds.add(product_partnership.organization.id);
      for (const organization of newPartners.values())
        newIds.add(organization.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deletePartners.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addPartners.push(newId);
      return { deletePartners, addPartners };
    },
    [product.product_partnership]
  );

  /** Submits validated data */
  const submitValidated = useCallback(
    async (data: Data): Promise<boolean> => {
      if (!dirty) {
        new Notification().warning(en ? "No Changes" : "Aucun changement");
        return true;
      }
      setLoading(true);
      const { addTargets, deleteTargets } = diffTargets(data.targets);
      const { addPartners, deletePartners } = diffPartners(data.organizations);
      const { addMembers, deleteMembers } = diffMembers(data.members);
      const params: UpdateProductPublicParams = {
        title_en: data.title_en,
        title_fr: data.title_fr,
        publish_date: data.publish_date?.toISOString() || null,
        all_author: data.all_author || "",
        doi: data.doi || "",
        product_type_id: data.product_type_id || null,
        note: data.note || "",
        deleteTargets,
        addTargets,
        deletePartners,
        addPartners,
        deleteMembers,
        addMembers,
        institutes: data.institutes,
      };

      const newInfo = await updateProductPublic(product.id, params);
      setLoading(false);
      if (newInfo) {
        setDirty(false);
        onSuccess(newInfo);
      }
      return !!newInfo;
    },
    [
      onSuccess,
      diffTargets,
      diffPartners,
      diffMembers,
      product.id,
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

  function getInitialMembers(product_member_author: ProductMemberAuthor[]) {
    const initialMembers = new Map(
      product_member_author.map((k) => [
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
    return initialMembers;
  }

  function getInitialTargets() {
    return new Map(product.product_target.map((k) => [k.target.id, k.target]));
  }

  function getInitialPartners() {
    return new Map(
      product.product_partnership.map((k) => [
        k.organization.id,
        k.organization,
      ])
    );
  }

  const initialValues: Data = {
    title_en: product.title_en,
    title_fr: product.title_fr,
    publish_date: product.publish_date
      ? moment(
          product.publish_date instanceof Date
            ? product.publish_date.toISOString().split("T")[0]
            : (product.publish_date as string).split("T")[0]
        )
      : null,
    all_author: product.all_author || "",
    doi: product.doi || "",
    product_type_id: product.product_type?.id,
    note: product.note || "",
    targets: getInitialTargets(),
    organizations: getInitialPartners(),
    // @ts-ignore
    members: getInitialMembers(product.product_member_author),
    institutes: product.institutes
      ? product.institutes.map((i) => i.institute.id)
      : [],
  };

  return (
    <div className="public-product-form-container">
      <Divider />
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="public-product-form"
        onValuesChange={() => setDirty(true)}
      >
        <Form.Item
          label={en ? "Title (English)" : "Titre (anglais)"}
          name="title_en"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={en ? "Title (French)" : "Titre (français)"}
          name="title_fr"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={en ? "Product Type" : "Type de produit"}
          name="product_type_id"
        >
          <Select>
            <Option value="">{""}</Option>
            {productTypes.map((f) => (
              <Option key={f.id} value={f.id}>
                <GetLanguage obj={f} />
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={en ? "Publication date" : "Date de publication"}
          name="publish_date"
          className="date-picker"
        >
          <DatePicker />
        </Form.Item>

        <label htmlFor="targets">
          {en ? "Product target" : "Cible du produit"}
        </label>
        <Form.Item name="targets">
          <TargetSelector
            setErrors={(e) => form.setFields([{ name: "targets", errors: e }])}
          />
        </Form.Item>

        <label htmlFor="organizations">
          {en ? "Product partner" : "Partenaire du produit"}
        </label>

        <Form.Item name="organizations">
          <PartnerSelector
            setErrors={(e) =>
              form.setFields([{ name: "organizations", errors: e }])
            }
          />
        </Form.Item>

        <Form.Item label={en ? "Authors" : "Auteurs"} name="all_author">
          <TextArea rows={4} spellCheck="false" />
        </Form.Item>
        <label htmlFor="members">
          {en ? "Member authors" : "Auteurs membres"}
        </label>
        <Form.Item name="members">
          <MemberSelector
            setErrors={(e) => form.setFields([{ name: "members", errors: e }])}
          />
        </Form.Item>

        <Form.Item
          label={en ? "Select Institute" : "Sélectionnez l'institut"}
          name="institutes"
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

        <Form.Item label={en ? "DOI" : "DOI"} name="doi">
          <Input />
        </Form.Item>

        <Form.Item label={en ? "Abstract" : "Résumé"} name="note">
          <TextArea rows={4} spellCheck="false" />
        </Form.Item>

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

export default PublicProductForm;
