import type {
  RegisterInstituteParams,
  RegisterInstituteRes,
} from "../pages/api/register-institute"; // Define these types according to your API's expected request and response structures
import ApiRoutes from "../routing/api-routes";
import { en } from "./context/language-ctx";
import getAuthHeader from "./headers/auth-header";
import { contentTypeJsonHeader } from "./headers/content-type-headers";
import Notification from "./notifications/notification";

export default async function registerInstitute(
  params: RegisterInstituteParams
): Promise<RegisterInstituteRes | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;

  const notification = new Notification();
  try {
    notification.loading(
      en ? "Registering Institute..." : "Enregistrement de l'institut"
    );
    const res = await fetch(ApiRoutes.registerInstitute, {
      method: "POST", // Assuming POST is used for creating new institutes
      headers: { ...authHeader, ...contentTypeJsonHeader },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw await res.text();
    notification.success(
      en
        ? "Institute registered successfully!"
        : "Institut enregistré avec succès !"
    );
    return await res.json();
  } catch (e: any) {
    notification.error(e);
    return null;
  }
}
