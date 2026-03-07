import type { problem, faculty, member_type, keyword } from "@prisma/client";
import { type FC, useContext } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";

const GetOppositeLanguage: FC<{
  obj: problem | faculty | member_type | keyword | null;
}> = ({ obj }) => {
  const { en } = useContext(LanguageCtx);
  if (!obj) return <></>;
  if (en) return <>{obj.name_fr || obj.name_en || ""}</>;
  return <>{obj.name_en || obj.name_fr || ""}</>;
};

export default GetOppositeLanguage;
