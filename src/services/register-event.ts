import type {
  RegisterEventParams,
  RegisterEventRes,
} from "../pages/api/register-event";
import ApiRoutes from "../routing/api-routes";
import { en } from "./context/language-ctx";
import getAuthHeader from "./headers/auth-header";
import { contentTypeJsonHeader } from "./headers/content-type-headers";
import Notification from "./notifications/notification";
import { useSelectedInstitute } from "./context/selected-institute-ctx";

export default async function registerEvent(
  params: RegisterEventParams
): Promise<RegisterEventRes | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;

  const notification = new Notification();
  try {
    notification.loading(
      en ? "Registering an event..." : "Enregistrement d'un événement..."
    );
    const res = await fetch(ApiRoutes.registerEvent, {
      method: "PUT",
      headers: { ...authHeader, ...contentTypeJsonHeader },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw await res.text();
    notification.success();
    return await res.json();
  } catch (e: any) {
    notification.error(e);
    return null;
  }
}
