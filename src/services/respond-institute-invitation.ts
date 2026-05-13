import type { RespondInstituteInvitationParams } from "../pages/api/update-account/[id]/respond-institute-invitation";
import ApiRoutes from "../routing/api-routes";
import { en } from "./context/language-ctx";
import getAuthHeader from "./headers/auth-header";
import { contentTypeJsonHeader } from "./headers/content-type-headers";
import Notification from "./notifications/notification";
import type { AccountInfo } from "./_types";

export default async function respondInstituteInvitation(
  id: number,
  params: RespondInstituteInvitationParams
): Promise<AccountInfo | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;

  const notification = new Notification();
  try {
    notification.loading(
      en
        ? "Updating invitation..."
        : "Mise à jour de l'invitation..."
    );
    const res = await fetch(ApiRoutes.respondInstituteInvitation(id), {
      headers: { ...authHeader, ...contentTypeJsonHeader },
      method: "PATCH",
      body: JSON.stringify(params),
    });
    if (!res.ok) throw await res.text();
    notification.success(
      params.action === "accept"
        ? en
          ? "Invitation accepted."
          : "Invitation acceptée."
        : en
        ? "Invitation rejected."
        : "Invitation refusée."
    );
    return await res.json();
  } catch (e: any) {
    notification.error(e);
    return null;
  }
}
