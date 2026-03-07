import type {
  problem,
  faculty,
  member_type,
  keyword,
  org_type,
  org_scope,
  organization,
  product_type,
} from "@prisma/client";
import { type FC, useContext } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";

const GetLanguage: FC<{
  obj:
    | problem
    | faculty
    | member_type
    | org_type
    | org_scope
    | keyword
    | organization
    | product_type
    | null;
}> = ({ obj }) => {
  const { en } = useContext(LanguageCtx);
  if (!obj) return <></>;
  if (en) return <>{obj.name_en || obj.name_fr || ""}</>;
  return <>{obj.name_fr || obj.name_en || ""}</>;
};

export default GetLanguage;
