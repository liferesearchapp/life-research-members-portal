import type { product } from "@prisma/client";
import { type FC, useContext } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";

const GetLanguage: FC<{
  obj: product | null;
}> = ({ obj }) => {
  const { en } = useContext(LanguageCtx);
  if (!obj) return <></>;
  if (en) return <>{obj.title_en || obj.title_fr || ""}</>;
  return <>{obj.title_fr || obj.title_en || ""}</>;
};

export default GetLanguage;
