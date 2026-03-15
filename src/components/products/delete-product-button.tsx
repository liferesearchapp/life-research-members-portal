// This component is a button that opens a modal to delete a product.
// The modal contains a form that requires the user to confirm the product name before deletion.

import {
  type CSSProperties,
  type Dispatch,
  type FC,
  type SetStateAction,
  useContext,
  useState,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { ProductPrivateInfo } from "../../services/_types";
import deleteProduct from "../../services/delete-product";
import { useRouter } from "next/router";
import PageRoutes from "../../routing/page-routes";
import Notification from "../../services/notifications/notification";
import { Button, Form, Input, Modal, Alert, Typography } from "antd";
const useForm = Form.useForm;
const Text = Typography.Text;

type Data = { confirmation: string };
type Props = {
  product: ProductPrivateInfo;
  setProduct: Dispatch<SetStateAction<ProductPrivateInfo | null>>;
  style?: CSSProperties;
};

const DeleteProductButton: FC<Props> = ({ product, setProduct, style }) => {
  const { en } = useContext(LanguageCtx);
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = useForm<Data>();

  const productName = en ? product.title_en : product.title_fr;

  async function submit() {
    const res = await deleteProduct(product.id);
    if (res) {
      setModalOpen(false);
      router.push(PageRoutes.products);
    }
  }

  function openModal() {
    setModalOpen(true);
  }

  return (
    <>
      <Button
        danger
        type="primary"
        size="large"
        onClick={openModal}
        style={style}
      >
        {en ? "Delete Product" : "Supprimer le produit"}
      </Button>
      <Modal
        title={
          (en ? "Delete Product: " : "Supprimer le produit : ") + productName
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{
          htmlType: "submit",
          form: "delete-product-form",
          danger: true,
        }}
        okText={en ? "Delete Product" : "Supprimer le produit"}
        cancelButtonProps={{ danger: true }}
        cancelText={en ? "Cancel" : "Annuler"}
        destroyOnClose
        styles={{ body: { paddingBottom: 0 } }}
      >
        <Alert
          showIcon
          type="warning"
          message={en ? "Warning!" : "Avertissement !"}
          description={
            en
              ? "This action is irreversible, this product will be permanently deleted. To confirm, input the product's name."
              : "Cette action est irréversible, ce produit sera définitivement supprimé. Pour confirmer, saisissez le nom du produit."
          }
          style={{ marginBottom: 16 }}
        ></Alert>
        <Form
          form={form}
          layout="vertical"
          id="delete-product-form"
          onFinish={submit}
          preserve={false}
        >
          <Form.Item
            name="confirmation"
            label={
              <Text>
                {en ? "Type: " : "Tapez : "}
                <b>
                  <span style={{ color: "red" }}>{productName}</span>
                </b>
                {" to confirm"}
              </Text>
            }
            validateFirst
            rules={[
              { required: true, message: en ? "Required" : "Requis" },
              {
                validator: (_, v) =>
                  v === productName
                    ? Promise.resolve()
                    : Promise.reject(en ? "Incorrect" : "Incorrect"),
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DeleteProductButton;
