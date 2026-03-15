import type { UpdateProductPublicParams } from "../pages/api/update-product/[id]/public";
import ApiRoutes from "../routing/api-routes";
import { en } from "./context/language-ctx";
import getAuthHeader from "./headers/auth-header";
import { contentTypeJsonHeader } from "./headers/content-type-headers";
import Notification from "./notifications/notification";
import type { ProductPrivateInfo } from "./_types";

export default async function updateProductPublic(
  id: number,
  params: UpdateProductPublicParams,
  instituteId: number
): Promise<ProductPrivateInfo | null> {
  const authHeader = await getAuthHeader();
  if (!authHeader) return null;

  const notification = new Notification();
  try {
    notification.loading(
      en
        ? "Updating Product Info..."
        : "Mise à jour des informations sur le produit..."
    );
    const res = await fetch(ApiRoutes.updateProductPublic(id), {
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
