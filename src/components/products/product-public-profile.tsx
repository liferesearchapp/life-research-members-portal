// This component displays the public profile of a product
// The component uses the "PublicProductDescription" component to display the description of the product
// The component uses the LanguageCtx to display the title of the product in either English or French based on the language context value

import { type FC, useContext } from "react";
import usePublicProductInfo from "../../services/use-public-product-info";
import CardSkeleton from "../loading/card-skeleton";
import PublicProductDescription from "./product-public-description";
import { LanguageCtx } from "../../services/context/language-ctx";
import { Empty, Card, Typography } from "antd";
const Title = Typography.Title;

type Props = {
  id: number;
};

const PublicProductProfile: FC<Props> = ({ id }) => {
  const { product, loading } = usePublicProductInfo(id);
  const { en } = useContext(LanguageCtx);

  if (loading) return <CardSkeleton />;
  if (!product) return <Empty />;

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
    </div>
  );

  return (
    <Card title={header}>
      <PublicProductDescription product={product} />
    </Card>
  );
};

export default PublicProductProfile;
