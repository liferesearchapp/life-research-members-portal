// this is a  component that displays a private product profile.
// The component also uses several other components such as ProductPrivateDescription, ProductPrivateForm, ProductAdminForm and DeleteProductButton.

import Empty from "antd/lib/empty";
import Button from "antd/lib/button";
import Card from "antd/lib/card/Card";
import Title from "antd/lib/typography/Title";
import { FC, ReactNode, useCallback, useContext, useState } from "react";
import CardSkeleton from "../loading/card-skeleton";
import PublicProductDescription from "./product-public-description";
import PublicProductForm from "./product-public-form";
import ProductAdminForm from "./product-admin-form";
import usePrivateProductInfo from "../../services/use-private-product-info";
import { LanguageCtx } from "../../services/context/language-ctx";
import Tabs from "antd/lib/tabs";
import type { ProductPrivateInfo } from "../../services/_types";
import { SaveChangesCtx } from "../../services/context/save-changes-ctx";
import ProductAdminDescription from "./product-admin-description";
import PrivateProductDescription from "./product-private-description";
import PrivateProductForm from "./product-private-form";
import DeleteProductButton from "./delete-product-button";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { useAdminDetails } from "../../services/context/selected-institute-ctx";

type Tab = { label: string; key: string; children: ReactNode };

const keys = { public: "public", private: "private", admin: "admin" };

type Props = {
  id: number;
};

const PrivateProductProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { product, setProduct, loading } = usePrivateProductInfo(id);
  const [editMode, setEditMode] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState(keys.public);
  const { saveChangesPrompt } = useContext(SaveChangesCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const isAdmin = useAdminDetails();
  /** After saving changes via submit button - dependency of form's submit */
  const onSuccess = useCallback(
    (updatedProduct: ProductPrivateInfo) => setProduct(updatedProduct),
    [setProduct]
  );

  if (loading) return <CardSkeleton />;
  if (!product) return <Empty />;

  /** When clicking cancel - prompt to save changes if dirty */
  function onCancel() {
    saveChangesPrompt({ onSuccessOrDiscard: () => setEditMode(false) });
  }

  /** When changing tabs - prompt to save changes if dirty */
  async function onChange(key: string) {
    saveChangesPrompt({ onSuccessOrDiscard: () => setActiveTabKey(key) });
  }

  const editButton = (
    <Button
      size="large"
      type="primary"
      style={{ flexGrow: 1, maxWidth: "10rem" }}
      onClick={() => setEditMode(true)}
    >
      {en ? "Edit" : "Éditer"}
    </Button>
  );

  const doneButton = (
    <Button
      size="large"
      danger
      style={{ flexGrow: 1, maxWidth: "10rem" }}
      onClick={onCancel}
    >
      {en ? "Done" : "Fini"}
    </Button>
  );

  const header = (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <Title
        level={2}
        style={{
          margin: 0,
          minWidth: 0,
          marginRight: "auto",
          paddingRight: 16,
          whiteSpace: "break-spaces",
        }}
      >
        {en ? product.title_en : product.title_fr}
      </Title>
      {editMode ? doneButton : editButton}
    </div>
  );

  const descriptions: Tab[] = [
    {
      label: en ? "Public" : "Public",
      key: keys.public,
      children: <PublicProductDescription product={product} />,
    },
    {
      label: en ? "Private" : "Privé",
      key: keys.private,
      children: <PrivateProductDescription product={product} />,
    },
    ...(localAccount && isAdmin
      ? [
          {
            label: en ? "Admin" : "Admin",
            key: keys.admin,
            children: <ProductAdminDescription product={product} />,
          },
        ]
      : []),
  ];

  const forms: Tab[] = [
    {
      label: en ? "Public" : "Publique",
      key: keys.public,
      children: <PublicProductForm product={product} onSuccess={onSuccess} />,
    },
    {
      label: en ? "Private" : "Privé",
      key: keys.private,
      children: <PrivateProductForm product={product} onSuccess={onSuccess} />,
    },
    ...(localAccount && isAdmin
      ? [
          {
            label: en ? "Admin" : "Admin",
            key: keys.admin,
            children: (
              <ProductAdminForm product={product} onSuccess={onSuccess} />
            ),
          },
        ]
      : []),
  ];

  return (
    <Card title={header} bodyStyle={{ paddingTop: 0 }}>
      <Tabs
        items={editMode ? forms : descriptions}
        // items={descriptions}
        activeKey={activeTabKey}
        onChange={onChange}
        // Very important to destroy inactive forms,
        // so they register their submit function to the save changes context when navigated back
        destroyInactiveTabPane
      />

      <DeleteProductButton
        product={product}
        setProduct={setProduct}
        style={{ marginLeft: "auto", marginTop: "20px", display: "block" }}
      />
    </Card>
  );
};

export default PrivateProductProfile;
