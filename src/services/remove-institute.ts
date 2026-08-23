import ApiRoutes from "../routing/api-routes";
import { en } from "./context/language-ctx";
import getAuthHeader from "./headers/auth-header";
import { contentTypeJsonHeader } from "./headers/content-type-headers";
import Notification from "./notifications/notification";
import type { AccountInfo } from "./_types";
import type { RemoveInstituteParams } from "../pages/api/update-account/[id]/remove-institute";

export default async function removeInstitute(
  id: number,
  params: RemoveInstituteParams
): Promise<AccountInfo | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;

  const notification = new Notification();
  try {
    notification.loading(
      en
        ? "Removing institute from account..."
        : "Retrait de l'institut du compte..."
    );
    const res = await fetch(ApiRoutes.removeInstitute(id), {
      headers: { ...authHeader, ...contentTypeJsonHeader },
      method: "PATCH",
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
