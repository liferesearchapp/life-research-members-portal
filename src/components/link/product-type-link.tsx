import type { product_type } from "@prisma/client";
import type { FC } from "react";
import PageRoutes from "../../routing/page-routes";
import GetLanguage from "../../utils/front-end/get-language";
import { queryKeys } from "../products/all-products";
import SafeLink from "./safe-link";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

type Props = {
  product_type: product_type | null;
};

const ProductTypeLink: FC<Props> = ({ product_type }) => {
  const { institute } = useSelectedInstitute();
  if (!product_type) return null;
  return (
    <SafeLink
      href={{
        pathname: PageRoutes.allProducts(institute?.urlIdentifier || ""),
        query: {
          [queryKeys.productTypes]: product_type.id,
          [queryKeys.showType]: true,
        },
      }}
    >
      <GetLanguage obj={product_type} />
    </SafeLink>
  );
};

export default ProductTypeLink;
