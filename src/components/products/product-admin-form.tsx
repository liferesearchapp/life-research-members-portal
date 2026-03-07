//This component is a form that allows to update the admin information of a product.

import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import type { ProductPrivateInfo } from "../../services/_types";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { UpdateProductAdminParams } from "../../pages/api/update-product/[id]/admin";
import updateProductAdmin from "../../services/update-product-admin";

import type { topic } from "@prisma/client";
import TopicSelector from "../topics/topic-selector";

import Notification from "../../services/notifications/notification";
import {
  SaveChangesCtx,
  useResetDirtyOnUnmount,
} from "../../services/context/save-changes-ctx";
import { Button, Form, Input, Divider, Typography } from "antd";
const { useForm } = Form;
const TextArea = Input.TextArea;
const Text = Typography.Text;

type Props = {
  product: ProductPrivateInfo;
  onSuccess: (member: ProductPrivateInfo) => void;
};

type Data = {
  topics: Map<number, topic>;
};

const ProductAdminForm: FC<Props> = ({ product, onSuccess }) => {
  // This sets the return type of the form
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const [loading, setLoading] = useState(false);
  const { dirty, setDirty, setSubmit } = useContext(SaveChangesCtx);
  useResetDirtyOnUnmount();

  const diffTopics = useCallback(
    (
      newTopics: Map<number, topic>
    ): {
      deleteTopics: number[];
      addTopics: number[];
    } => {
      const oldIds = new Set<number>();
      const newIds = new Set<number>();
      const deleteTopics: number[] = [];
      const addTopics: number[] = [];
      for (const product_topic of product.product_topic)
        oldIds.add(product_topic.topic.id);
      for (const topic of newTopics.values()) newIds.add(topic.id);
      for (const oldId of oldIds.values())
        if (!newIds.has(oldId)) deleteTopics.push(oldId);
      for (const newId of newIds.values())
        if (!oldIds.has(newId)) addTopics.push(newId);
      return { deleteTopics, addTopics };
    },
    [product.product_topic]
  );

  /** Submits validated data */
  const submitValidated = useCallback(
    async (data: Data): Promise<boolean> => {
      if (!dirty) {
        new Notification().warning(en ? "No Changes" : "Aucun changement");
        return true;
      }
      setLoading(true);
      const { addTopics, deleteTopics } = diffTopics(data.topics);
      const params: UpdateProductAdminParams = {
        addTopics,
      };
      const newInfo = await updateProductAdmin(product.id, params);
      setLoading(false);
      if (newInfo) {
        setDirty(false);
        onSuccess(newInfo);
      }
      return !!newInfo;
    },
    [dirty, product.id, en, diffTopics, setDirty, onSuccess]
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

  /** Pass submit function to parent */
  useEffect(() => {
    setSubmit(() => validateAndSubmit);
  }, [setSubmit, validateAndSubmit]);

  function getInitialTopics() {
    return new Map(product.product_topic.map((k) => [k.topic.id, k.topic]));
  }

  const initialValues: Data = {
    topics: getInitialTopics(),
  };

  return (
    <div className="member-admin-form-container">
      <Divider />
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="member-insight-form"
        onValuesChange={() => setDirty(true)}
      >
        <div className="row">
          <label htmlFor="topics">
            {en ? "Product topic" : "Sujet du produit"}
          </label>
          <Divider />
          <Form.Item name="topics">
            <TopicSelector
              setErrors={(e) => form.setFields([{ name: "topics", errors: e }])}
            />
          </Form.Item>
          <Divider />
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

export default ProductAdminForm;
