import Button from "antd/lib/button";
import Form from "antd/lib/form";
import { useForm } from "antd/lib/form/Form";
import Input from "antd/lib/input";
import React, { FC, useCallback, useContext, useEffect, useState } from "react";
import type { InstituteInfo } from "../../services/_types";
import { LanguageCtx } from "../../services/context/language-ctx";
import Divider from "antd/lib/divider";
import Text from "antd/lib/typography/Text";
import type { UpdateInstituteParams } from "../../pages/api/update-institute/[id]/private";
import updateInstitute from "../../services/update-institute";
import { red } from "@ant-design/colors";
import Switch from "antd/lib/switch";
import Notification from "../../services/notifications/notification";
import { SaveChangesCtx, useResetDirtyOnUnmount } from "../../services/context/save-changes-ctx";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import {
  BrandColorInput,
  BrandingImageInput,
} from "./branding-inputs";
import {
  DEFAULT_BRAND_COLORS,
  DEFAULT_LARGE_LOGO,
  DEFAULT_SMALL_LOGO,
} from "../../utils/front-end/institute-branding";

type Props = {
  institute: InstituteInfo;
  onSuccess: (institute: InstituteInfo) => void;
};

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
  is_active: boolean;
};

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

const InstituteForm: FC<Props> = ({ institute, onSuccess }) => {
  // This sets the return type of the form
  const [form] = useForm<Data>();
  const { en } = useContext(LanguageCtx);
  const { localAccount } = useContext(ActiveAccountCtx);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(institute.is_active);
  const { dirty, setDirty, setSubmit } = useContext(SaveChangesCtx);
  useResetDirtyOnUnmount();
  const isSuperAdmin = !!localAccount?.is_super_admin;

  /** Submits validated data */
  const submitValidated = useCallback(
    async (data: Data): Promise<boolean> => {
      if (!dirty) {
        new Notification().warning(en ? "No Changes" : "Aucun changement");
        return true;
      }
      setLoading(true);
      const params: UpdateInstituteParams = {
        name: data.name,
        name_fr: data.name_fr || null,
        urlIdentifier: data.urlIdentifier || institute.urlIdentifier,
        description_en: data.description_en,
        description_fr: data.description_fr,
        largeLogo: data.largeLogo,
        smallLogoEn: data.smallLogoEn,
        smallLogoFr: data.smallLogoFr,
        primaryColor: data.primaryColor,
        primaryColorDark: data.primaryColorDark,
        secondaryColor: data.secondaryColor,
        secondaryColorDark: data.secondaryColorDark,
        accentColor: data.accentColor,
        is_active: data.is_active ?? institute.is_active,
      };
      const newInfo = await updateInstitute(institute.id, params);
      setLoading(false);
      if (newInfo) {
        setDirty(false);
        onSuccess(newInfo);
      }
      return !!newInfo;
    },
    [
      dirty,
      en,
      institute.id,
      institute.is_active,
      institute.urlIdentifier,
      onSuccess,
      setDirty,
    ]
  );

  /** When called from context - need to validate manually */
  const validateAndSubmit = useCallback(async () => {
    try {
      return submitValidated(await form.validateFields());
    } catch (e: any) {
      new Notification().warning(en ? "A field is invalid!" : "Un champ est invalide!");
      return false;
    }
  }, [en, form, submitValidated]);

  /** Pass submit function to context */
  useEffect(() => {
    setSubmit(() => validateAndSubmit);
  }, [setSubmit, validateAndSubmit]);

  function onChange(changed: any, data: Data) {
    setDirty(true);
    if (status !== data.is_active) setStatus(data.is_active);
  }

  const initialValues: Data = {
    name: institute.name,
    name_fr: institute.name_fr || "",
    urlIdentifier: institute.urlIdentifier,
    description_en: institute.description_en || "",
    description_fr: institute.description_fr || "",
    largeLogo: institute.largeLogo,
    smallLogoEn: institute.smallLogoEn,
    smallLogoFr: institute.smallLogoFr,
    primaryColor: institute.primaryColor,
    primaryColorDark: institute.primaryColorDark,
    secondaryColor: institute.secondaryColor,
    secondaryColorDark: institute.secondaryColorDark,
    accentColor: institute.accentColor,
    is_active: institute.is_active,
  };

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
    <div className="institute-form-container">
      <Text strong>
        {en
          ? "Institute administrators and super administrators can manage this branding."
          : "Les administrateurs d'institut et les super administrateurs peuvent gérer cette identité visuelle."}
      </Text>
      <Divider />
      <Form
        form={form}
        onFinish={submitValidated}
        initialValues={initialValues}
        layout="vertical"
        className="institute-form"
        onValuesChange={onChange}
      >
        <div className="row">
          <Form.Item
            label={en ? "Name (English)" : "Nom (Anglais)"}
            name="name"
            className="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: en
                  ? "Institute name is required."
                  : "Le nom de l'institut est requis.",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={en ? "Name (French - Optional)" : "Nom (Français - Facultatif)"}
            name="name_fr"
            className="name_fr"
            help={en ? "If not provided, the English name will be used in French mode." : "Si non fourni, le nom anglais sera utilisé en mode français."}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Description (EN)"
            name="description_en"
            className="description_en"
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            label="Description (FR)"
            name="description_fr"
            className="description_fr"
          >
            <Input.TextArea />
          </Form.Item>
          {isSuperAdmin ? (
            <>
              <Form.Item
                label={en ? "URL Identifier" : "Identifiant URL"}
                name="urlIdentifier"
                className="urlIdentifier"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: en
                      ? "URL identifier is required."
                      : "L'identifiant URL est requis.",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="is_active"
                valuePropName="checked"
                label={
                  status
                    ? en
                      ? "Status: Active"
                      : "Statut : Actif"
                    : en
                    ? "Status: Inactive"
                    : "Statut : Inactif"
                }
                help={
                  <Text style={{ color: red[5] }}>
                    {status
                      ? ""
                      : en
                      ? "This institute will be hidden"
                      : "Cet institut sera caché"}
                  </Text>
                }
              >
                <Switch />
              </Form.Item>
            </>
          ) : null}
        </div>

        <Divider orientation="left">
          {en ? "Logos" : "Logos"}
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
          {en ? "Theme Colors" : "Couleurs du thème"}
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
          <BrandColorInput
            fallbackColor={DEFAULT_BRAND_COLORS.primaryColorDark}
          />
        </Form.Item>
        <Form.Item
          label={en ? "Secondary Color" : "Couleur secondaire"}
          name="secondaryColor"
          rules={[colorRule]}
        >
          <BrandColorInput
            fallbackColor={DEFAULT_BRAND_COLORS.secondaryColor}
          />
        </Form.Item>
        <Form.Item
          label={en ? "Secondary Dark Color" : "Couleur secondaire foncée"}
          name="secondaryColorDark"
          rules={[colorRule]}
        >
          <BrandColorInput
            fallbackColor={DEFAULT_BRAND_COLORS.secondaryColorDark}
          />
        </Form.Item>
        <Form.Item
          label={en ? "Accent Color" : "Couleur d'accent"}
          name="accentColor"
          rules={[colorRule]}
        >
          <BrandColorInput fallbackColor={DEFAULT_BRAND_COLORS.accentColor} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            style={{ paddingLeft: 40, paddingRight: 40 }}
            size="large"
            loading={loading}
          >
            {en ? "Save Changes" : "Sauvegarder"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default InstituteForm;
