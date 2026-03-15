import { useEffect, useState } from "react";
import ApiRoutes from "../routing/api-routes";
import getAuthHeader from "./headers/auth-header";
import type { InstituteInfo } from "./_types";

export default function useInstituteInfo(id: number) {
  const [institute, setInstitute] = useState<InstituteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchInstitute(id: number) {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      setLoading(true);
      const res = await fetch(ApiRoutes.institute(id), { headers: authHeader });
      if (!res.ok) return console.error(await res.text());
      setInstitute(await res.json());
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInstitute(id);
  }, [id]);

  function refresh() {
    fetchInstitute(id);
  }

  return { institute, setInstitute, loading, refresh };
}