/* eslint-disable @next/next/no-img-element */
import Grid from "antd/lib/grid";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import { FC, useContext } from "react";
import type { InstituteInfo } from "../../services/_types";
import React from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import {
  DEFAULT_BRAND_COLORS,
  getInstituteLargeLogo,
  getInstituteSmallLogo,
} from "../../utils/front-end/institute-branding";

const { useBreakpoint } = Grid;

type Props = {
  institute: InstituteInfo;
};

const InstituteDescription: FC<Props> = ({ institute }) => {
  const screens = useBreakpoint();
  const { en } = useContext(LanguageCtx);

  function renderColorSwatch(color: string | null | undefined, fallback: string) {
    const value = color || fallback;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: value,
            border: "1px solid #d9d9d9",
            display: "inline-block",
          }}
        />
        <span>{value}</span>
      </div>
    );
  }

  function renderImage(src: string, alt: string) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          display: "block",
          maxWidth: "100%",
          maxHeight: 120,
          objectFit: "contain",
        }}
      />
    );
  }

  return (
    <Descriptions
      size="small"
      bordered
      column={1}
      labelStyle={{ whiteSpace: "nowrap", width: 0 }}
      layout={screens.xs ? "vertical" : "horizontal"}
    >
      <Item label={en ? "Active" : "Active"}>
        {institute.is_active
          ? en
            ? "Yes"
            : "Oui"
          : (en ? "No" : "Non")}
      </Item>
      <Item label={en ? "Name" : "Nom"}>{institute.name}</Item>
      <Item label={en ? "URL Identifier" : "Identifiant URL"}>{institute.urlIdentifier}</Item>
      <Item label="Description (EN)">{institute.description_en}</Item>
      <Item label="Description (FR)">{institute.description_fr}</Item>
      <Item label={en ? "Large Logo" : "Grand logo"}>
        {renderImage(
          getInstituteLargeLogo(institute),
          en ? "Large institute logo" : "Grand logo de l'institut"
        )}
      </Item>
      <Item label={en ? "Small Logo (EN)" : "Petit logo (EN)"}>
        {renderImage(
          getInstituteSmallLogo({ smallLogoEn: institute.smallLogoEn }, true),
          en ? "English institute logo" : "Logo anglais de l'institut"
        )}
      </Item>
      <Item label={en ? "Small Logo (FR)" : "Petit logo (FR)"}>
        {renderImage(
          getInstituteSmallLogo({ smallLogoFr: institute.smallLogoFr }, false),
          en ? "French institute logo" : "Logo français de l'institut"
        )}
      </Item>
      <Item label={en ? "Primary Color" : "Couleur primaire"}>
        {renderColorSwatch(
          institute.primaryColor,
          DEFAULT_BRAND_COLORS.primaryColor
        )}
      </Item>
      <Item label={en ? "Primary Dark Color" : "Couleur primaire foncée"}>
        {renderColorSwatch(
          institute.primaryColorDark,
          DEFAULT_BRAND_COLORS.primaryColorDark
        )}
      </Item>
      <Item label={en ? "Secondary Color" : "Couleur secondaire"}>
        {renderColorSwatch(
          institute.secondaryColor,
          DEFAULT_BRAND_COLORS.secondaryColor
        )}
      </Item>
      <Item label={en ? "Secondary Dark Color" : "Couleur secondaire foncée"}>
        {renderColorSwatch(
          institute.secondaryColorDark,
          DEFAULT_BRAND_COLORS.secondaryColorDark
        )}
      </Item>
      <Item label={en ? "Accent Color" : "Couleur d'accent"}>
        {renderColorSwatch(
          institute.accentColor,
          DEFAULT_BRAND_COLORS.accentColor
        )}
      </Item>
    </Descriptions>
  );
};

export default InstituteDescription;
