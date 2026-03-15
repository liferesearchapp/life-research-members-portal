import { type FC, useContext } from "react";
import KeywordTag from "./keyword-tag";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { keyword } from "@prisma/client";
import { Typography } from "antd";
const Text = Typography.Text;

type Props = { keyword: keyword; label: { en: string; fr: string } };
const KeywordPreview: FC<Props> = ({ keyword, label }) => {
  const { en } = useContext(LanguageCtx);
  const hasName = keyword.name_en || keyword.name_fr;
  return (
    <>
      <Text>{en ? label.en : label.fr}</Text>
      <br />
      <Text style={{ display: "inline-block", width: 24 }}>EN</Text>
      {hasName ? (
        <KeywordTag keyword={keyword} oppositeLanguage={!en} style={{ marginTop: 4 }} />
      ) : null}
      <br />
      <Text style={{ display: "inline-block", width: 24 }}>FR</Text>
      {hasName ? (
        <KeywordTag keyword={keyword} oppositeLanguage={en} style={{ marginTop: 8 }} />
      ) : null}
    </>
  );
};

export default KeywordPreview;
