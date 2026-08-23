import type { UpdateInstituteParams } from "../pages/api/update-institute/[id]/private";
import ApiRoutes from "../routing/api-routes";
import { en } from "./context/language-ctx";
import getAuthHeader from "./headers/auth-header";
import { contentTypeJsonHeader } from "./headers/content-type-headers";
import Notification from "./notifications/notification";
import type { InstituteInfo } from "./_types";

export default async function updateInstitute(
  id: number,
  params: UpdateInstituteParams
): Promise<InstituteInfo | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;

  const notification = new Notification();
  try {
    notification.loading(
      en ? "Updating Institute Info..." : "Mise à jour des informations sur les institut..."
    );
    const res = await fetch(ApiRoutes.updateInstitute(id), {
      method: "PATCH",
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