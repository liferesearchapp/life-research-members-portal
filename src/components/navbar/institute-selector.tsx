import { FC, useContext, useEffect, useMemo } from "react";
import Dropdown from "antd/lib/dropdown";
import Button from "antd/lib/button";
import { DownOutlined } from "@ant-design/icons";
import { InstituteSelectorCtx } from "../../services/context/institute-selector-ctx";
import { useRouter } from "next/router";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";
import Notification from "../../services/notifications/notification";
import type { MenuProps } from "antd";

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const InstituteSelector: FC = () => {
  const { instituteSelection, loading } = useContext(InstituteSelectorCtx);
  const { institute, setInstitute } = useSelectedInstitute();
  const router = useRouter();

  useEffect(() => {
    const currentInstituteUrlIdentifier = router.query.instituteId;
    if (!currentInstituteUrlIdentifier) return;
    const currentInstitute = instituteSelection.find(
      (institute) => institute.urlIdentifier === currentInstituteUrlIdentifier
    );

    if (currentInstitute) {
      setInstitute(currentInstitute);
    } else if (instituteSelection.length > 0 && !currentInstitute) {
      const notification = new Notification();
      setInstitute(null);
      router.push("/");
    }
  }, [instituteSelection, router, setInstitute]);

  const handleMenuClick = (e: any) => {
    const selectedInstitute = instituteSelection.find(
      (institute) => String(institute.id) === String(e.key)
    );
    if (selectedInstitute && selectedInstitute.urlIdentifier) {
      setInstitute(selectedInstitute);

      const currentInstituteUrlIdentifier =
        typeof router.query.instituteId === "string"
          ? router.query.instituteId
          : null;

      if (currentInstituteUrlIdentifier) {
        const nextPath = router.asPath.replace(
          new RegExp(
            `^/${escapeForRegex(currentInstituteUrlIdentifier)}(?=/|$)`
          ),
          `/${selectedInstitute.urlIdentifier}`
        );

        if (nextPath !== router.asPath) {
          void router.push(nextPath);
          return;
        }
      }

      if (router.asPath === "/") {
        void router.push(`/${selectedInstitute.urlIdentifier}`);
      }
    } else {
      console.error("Selected institute does not have a valid URL identifier.");
    }
  };
  const filteredInstitutes = useMemo(
    () =>
      instituteSelection
        .filter((m) => m.is_active)
        .map((m) => ({ key: String(m.id), label: m.name })),
    [instituteSelection]
  );
  const menu: MenuProps = {
    items: filteredInstitutes,
    onClick: handleMenuClick,
  };

  return (
    <Dropdown menu={menu} disabled={loading}>
      <Button>
        {institute?.name || "Select Institute"} <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default InstituteSelector;
