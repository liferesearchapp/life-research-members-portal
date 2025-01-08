// Assuming a type definition for updating institute parameters
import ApiRoutes from "../routing/api-routes";
import { en } from "./context/language-ctx";
import getAuthHeader from "./headers/auth-header";
import { contentTypeJsonHeader } from "./headers/content-type-headers";
import Notification from "./notifications/notification";
import type { AccountInfo } from "./_types";
import type { addInstituteParams } from "../pages/api/update-account/[id]/add-institute";

export default async function addInstitute(
  id: number,
  params: addInstituteParams
): Promise<AccountInfo | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;

  const notification = new Notification();
  try {
    notification.loading(
      en
        ? "Updating institute information..."
        : "Mise à jour des informations de l'institut..."
    );
    const res = await fetch(ApiRoutes.addInstitute(id), {
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
