// This component is used to register a new product in the system.
// It contains form fields for all the required information for product registration, including title (English and French), publication date, DOI, all authors, product type, status (on-going or not), peer reviewed or not, and abstract/note.
// The form uses the Antd UI library components to provide a user-friendly interface for input.
// Upon submission, the handleRegister function is called to send the product data to the server for storage.

import { Button, Col, DatePicker, Row, Switch } from "antd";
import Select from "antd/lib/select";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import React, { FC, useContext, useState } from "react";
import { useForm } from "antd/lib/form/Form";
import moment from "moment";
import type { Moment } from "moment";
import registerProduct from "../../services/register-product";
import { LanguageCtx } from "../../services/context/language-ctx";
import { ProductTypesCtx } from "../../services/context/products-types-ctx";
import GetLanguage from "../../utils/front-end/get-language";
import { MemberInstituteCtx } from "../../services/context/member-institutes-ctx";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

const { Option } = Select;

type Data = {
  title_en: string;
  title_fr: string;
  publish_date: Moment | null;
  doi: string;
  all_author: string;
  on_going: boolean;
  peer_reviewed: boolean;
  product_type_id: number;
  institute_id: number[];
  note: string;
};

const RegisterProduct: FC = () => {
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const { institutes } = useContext(MemberInstituteCtx);
  const { institute } = useSelectedInstitute();
  const { productTypes } = useContext(ProductTypesCtx);
  const [onGoing, setOnGoing] = useState(false);
  const [peerReviewed, setPeerReviewed] = useState(false);

  async function handleRegister({
    title_en,
    title_fr,
    publish_date,
    doi,
    all_author,
    product_type_id,
    institute_id,
    note,
  }: Omit<Data, "on_going" | "peer_reviewed">) {
    const res = await registerProduct({
      title_en,
      title_fr,
      publish_date: publish_date ? publish_date.toDate() : null,
      doi,
      all_author,
      on_going: onGoing,
      peer_reviewed: peerReviewed,
      product_type_id,
      institute_id,
      note,
    });
    if (res) form.resetFields();
  }

  return (
    <div className="register-product-form">
      <h1>{en ? "Register Product" : "Enregistrer un produit"}</h1>
      <Form
        form={form}
        onFinish={handleRegister}
        style={{ width: "100%", maxWidth: "30rem" }}
        size="large"
        layout="vertical"
      >
        <Form.Item
          label={en ? "Title (English)" : "Titre (anglais)"}
          name="title_en"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={en ? "Title (French)" : "Titre (français)"}
          name="title_fr"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={en ? "Published Date" : "Date de publication"}
          name="publish_date"
          className="date-picker"
        >
          <DatePicker />
        </Form.Item>
        <Form.Item label={en ? "DOI" : "DOI"} name="doi">
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "All Authors" : "Tous les auteurs"}
          name="all_author"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input.TextArea />
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
        {institute && (
          <Form.Item
            label={en ? "Select Institute" : "Sélectionnez l'institut"}
            name="institute_id"
            initialValue={[institute.id]}
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
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="on_going"
              valuePropName="checked"
              style={{ display: "inline-block" }}
            >
              {en ? "On Going: " : "En cours: "}

              <Switch checked={onGoing} onChange={() => setOnGoing(!onGoing)} />
              {onGoing ? " Yes" : " No"}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="peer_reviewed"
              valuePropName="checked"
              style={{ display: "inline-block" }}
            >
              {en ? "Peer Reviewed: " : "Examiné par les pairs: "}
              <Switch
                checked={peerReviewed}
                onChange={() => setPeerReviewed(!peerReviewed)}
              />

              {peerReviewed ? " Yes" : " No"}
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label={en ? "Abstract" : "Résumé"} name="note">
          <Input.TextArea />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ paddingLeft: 40, paddingRight: 40 }}
            size="large"
          >
            {en ? "Register" : "Enregistrer"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
export default RegisterProduct;
