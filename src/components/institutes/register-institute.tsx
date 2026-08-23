import { Button } from "antd";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Divider from "antd/lib/divider";
import { FC, useContext } from "react";

import { useForm } from "antd/lib/form/Form";
import { LanguageCtx } from "../../services/context/language-ctx";
import { InstituteSelectorCtx } from "../../services/context/institute-selector-ctx";
import { MemberInstituteCtx } from "../../services/context/member-institutes-ctx";
import registerInstitute from "../../services/register-institute";
import { BrandColorInput, BrandingImageInput } from "./branding-inputs";
import {
  DEFAULT_BRAND_COLORS,
  DEFAULT_LARGE_LOGO,
  DEFAULT_SMALL_LOGO,
} from "../../utils/front-end/institute-branding";

type Data = {
  name: string;
  name_fr: string;
  urlIdentifier: string;
  description_en: string;
  description_fr: string;
  largeLogo: string | null;
  smallLogoEn: string | null;
  smallLogoFr: string | null;
  primaryColor: string | null;
  primaryColorDark: string | null;
  secondaryColor: string | null;
  secondaryColorDark: string | null;
  accentColor: string | null;
};

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

const RegisterInstitute: FC = () => {
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const { refresh: refreshInstituteSelector } = useContext(InstituteSelectorCtx);
  const { refresh: refreshMemberInstitutes } = useContext(MemberInstituteCtx);

  async function handleRegister(data: Data) {
    const res = await registerInstitute({
      name: data.name,
      name_fr: data.name_fr || undefined,
      urlIdentifier: data.urlIdentifier,
      description_en: data.description_en,
      description_fr: data.description_fr,
      largeLogo: data.largeLogo || null,
      smallLogoEn: data.smallLogoEn || null,
      smallLogoFr: data.smallLogoFr || null,
      primaryColor: data.primaryColor || null,
      primaryColorDark: data.primaryColorDark || null,
      secondaryColor: data.secondaryColor || null,
      secondaryColorDark: data.secondaryColorDark || null,
      accentColor: data.accentColor || null,
    });
    if (res) {
      form.resetFields();
      refreshInstituteSelector();
      refreshMemberInstitutes();
    }
  }

  const colorRule = {
    validator(_: unknown, value: string | null) {
      if (!value) return Promise.resolve();
      if (HEX_COLOR_REGEX.test(value)) return Promise.resolve();
      return Promise.reject(
        new Error(
          en
            ? "Please enter a 6-digit hex color like #A4CE4C."
            : "Veuillez entrer une couleur hexadécimale à 6 chiffres comme #A4CE4C."
        )
      );
    },
  };

  return (
    <div className="register-account-form">
      <h1>{en ? "Create Institute" : "Créer un institut"}</h1>
      <h2 style={{ marginBottom: 24 }}>
        {en
          ? "This form will create a new institute."
          : "Ce formulaire créera un nouvel institut."}
      </h2>
      <Form
        form={form}
        onFinish={handleRegister}
        style={{ width: "100%", maxWidth: "36rem" }}
        size="large"
        layout="vertical"
      >
        <Form.Item
          label={en ? "Name (English)" : "Nom (Anglais)"}
          name="name"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "Name (French - Optional)" : "Nom (Français - Facultatif)"}
          name="name_fr"
          help={en ? "If not provided, the English name will be used in French mode." : "Si non fourni, le nom anglais sera utilisé en mode français."}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "URL Identifier" : "Identifiant URL"}
          name="urlIdentifier"
          rules={[{ required: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "Description (EN)" : "Description (EN)"}
          name="description_en"
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          label={en ? "Description (FR)" : "Description (FR)"}
          name="description_fr"
        >
          <Input.TextArea />
        </Form.Item>

        <Divider orientation="left">
          {en ? "Logos (Optional)" : "Logos (Facultatif)"}
        </Divider>

        <Form.Item
          label={en ? "Large Logo" : "Grand logo"}
          name="largeLogo"
        >
          <BrandingImageInput
            fallbackSrc={DEFAULT_LARGE_LOGO}
            alt={en ? "Large institute logo preview" : "Aperçu du grand logo"}
            helpText={
              en
                ? "Used on the institute landing page. Recommended for wide hero artwork."
                : "Utilisé sur la page d'accueil de l'institut. Recommandé pour un visuel large."
            }
          />
        </Form.Item>

        <Form.Item
          label={en ? "Small Logo (EN)" : "Petit logo (EN)"}
          name="smallLogoEn"
        >
          <BrandingImageInput
            fallbackSrc={DEFAULT_SMALL_LOGO}
            alt={en ? "English logo preview" : "Aperçu du logo anglais"}
            helpText={
              en
                ? "Shown in the navbar while the portal is in English."
                : "Affiché dans la barre de navigation lorsque le portail est en anglais."
            }
          />
        </Form.Item>

        <Form.Item
          label={en ? "Small Logo (FR)" : "Petit logo (FR)"}
          name="smallLogoFr"
        >
          <BrandingImageInput
            fallbackSrc={DEFAULT_SMALL_LOGO}
            alt={en ? "French logo preview" : "Aperçu du logo français"}
            helpText={
              en
                ? "Shown in the navbar while the portal is in French."
                : "Affiché dans la barre de navigation lorsque le portail est en français."
            }
          />
        </Form.Item>

        <Divider orientation="left">
          {en ? "Theme Colors (Optional)" : "Couleurs du thème (Facultatif)"}
        </Divider>

        <Form.Item
          label={en ? "Primary Color" : "Couleur primaire"}
          name="primaryColor"
          rules={[colorRule]}
        >
          <BrandColorInput fallbackColor={DEFAULT_BRAND_COLORS.primaryColor} />
        </Form.Item>
        <Form.Item
          label={en ? "Primary Dark Color" : "Couleur primaire foncée"}
          name="primaryColorDark"
          rules={[colorRule]}
        >
          <BrandColorInput fallbackColor={DEFAULT_BRAND_COLORS.primaryColorDark} />
        </Form.Item>
        <Form.Item
          label={en ? "Secondary Color" : "Couleur secondaire"}
          name="secondaryColor"
          rules={[colorRule]}
        >
          <BrandColorInput fallbackColor={DEFAULT_BRAND_COLORS.secondaryColor} />
        </Form.Item>
        <Form.Item
          label={en ? "Secondary Dark Color" : "Couleur secondaire foncée"}
          name="secondaryColorDark"
          rules={[colorRule]}
        >
          <BrandColorInput fallbackColor={DEFAULT_BRAND_COLORS.secondaryColorDark} />
        </Form.Item>
        <Form.Item
          label={en ? "Accent Color" : "Couleur d'accent"}
          name="accentColor"
          rules={[colorRule]}
        >
          <BrandColorInput fallbackColor={DEFAULT_BRAND_COLORS.accentColor} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ paddingLeft: 40, paddingRight: 40 }}
            size="large"
          >
            {en ? "Register" : "Enregistrer"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterInstitute;
