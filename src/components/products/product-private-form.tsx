// This component is used to display a form for editing the private information of a product.
// The form is populated with the private information of the product passed as a prop to the component.
// The form is built using the antd form library, and the onFinish event is used to submit the data to an API
// for updating the private information. The component also implements the SaveChangesCtx context for handling save changes notifications.

import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import type { ProductPrivateInfo } from "../../services/_types";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { UpdateProductPrivateParams } from "../../pages/api/update-product/[id]/private";
import updateProductPrivate from "../../services/update-product-private";
import { red } from "@ant-design/colors";
import Notification from "../../services/notifications/notification";
import {
  SaveChangesCtx,
  useResetDirtyOnUnmount,
} from "../../services/context/save-changes-ctx";
import { Button, Form, Input, Divider, Typography, Switch } from "antd";
const { useForm } = Form;
const Text = Typography.Text;

type Props = {
  product: ProductPrivateInfo;
  onSuccess: (member: ProductPrivateInfo) => void;
};

type Data = {
  peer_reviewed: boolean;
  on_going: boolean;
};

const PrivateProductForm: FC<Props> = ({ product, onSuccess }) => {
  // This sets the return type of the form
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const [loading, setLoading] = useState(false);
  const [on_going_status, setOnGoingStatus] = useState(product.peer_reviewed);
  const [peer_reviewed_status, setPeerReviewedStatus] = useState(
    product.peer_reviewed
  );
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
      /*  const activate = !member.is_active && data.is_active;
      const deactivate = member.is_active && !data.is_active; */
      const params: UpdateProductPrivateParams = {
        peer_reviewed: data.peer_reviewed,
        on_going: data.on_going,
      };

      const newInfo = await updateProductPrivate(product.id, params);
      setLoading(false);
      if (newInfo) {
        setDirty(false);
        onSuccess(newInfo);
      }
      return !!newInfo;
    },
    [dirty, en, product.id, onSuccess, setDirty]
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

  function onChange(changed: any, data: Data) {
    setDirty(true);
    if (peer_reviewed_status !== data.peer_reviewed)
      setPeerReviewedStatus(data.peer_reviewed);
    if (on_going_status !== data.on_going) setOnGoingStatus(data.on_going);
  }

  const initialValues: Data = {
    peer_reviewed: product.peer_reviewed,
    on_going: product.on_going,
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
          name="peer_reviewed"
          valuePropName="checked"
          label={
            peer_reviewed_status
              ? en
                ? "Peer reviewed: Yes"
                : "Évalué par les pairs	 : Oui"
              : en
              ? "Peer reviewed: No"
              : "Évalué par les pairs : Non"
          }
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="on_going"
          valuePropName="checked"
          label={
            on_going_status
              ? en
                ? "Ongoing: Yes"
                : "En cours	 : Oui"
              : en
              ? "Ongoing: No"
              : "En cours	: Non"
          }
        >
          <Switch />
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

export default PrivateProductForm;
