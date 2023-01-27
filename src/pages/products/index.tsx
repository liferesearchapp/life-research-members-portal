import type { NextPage } from "next/types";
import { useContext } from "react";
import AllPartners from "../../components/partners/all-partners";
import { LanguageCtx } from "../../services/context/language-ctx";

const Product: NextPage = () => {
  const { en } = useContext(LanguageCtx);

  return <AllPartners />;
};

export default Product;
