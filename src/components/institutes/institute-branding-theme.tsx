import { type FC, useEffect } from "react";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";
import { getInstituteCssVariables } from "../../utils/front-end/institute-branding";

const InstituteBrandingTheme: FC = () => {
  const { institute } = useSelectedInstitute();

  useEffect(() => {
    const root = document.documentElement;
    const variables = getInstituteCssVariables(institute);

    for (const [key, value] of Object.entries(variables)) {
      root.style.setProperty(key, value);
    }
  }, [institute]);

  return null;
};

export default InstituteBrandingTheme;
