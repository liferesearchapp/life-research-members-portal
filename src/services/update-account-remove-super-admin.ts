import ApiRoutes from "../routing/api-routes";
import { en } from "./context/language-ctx";
import getAuthHeader from "./headers/auth-header";
import Notification from "./notifications/notification";
import type { AccountInfo } from "./_types";

export default async function updateAccountRemoveSuperAdmin(
  id: number
): Promise<AccountInfo | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;

  const notification = new Notification();
  try {
    notification.loading(
      en
        ? "Revoking super admin privileges..."
        : "Révocation des privilèges de super administrateur..."
    );
    const res = await fetch(ApiRoutes.updateAccountRemoveSuperAdmin(id), {
      headers: authHeader,
      method: "PATCH",
    });
    if (!res.ok) throw await res.text();
    notification.success();
    return await res.json();
  } catch (e: any) {
    notification.error(e);
    return null;
  }
}
