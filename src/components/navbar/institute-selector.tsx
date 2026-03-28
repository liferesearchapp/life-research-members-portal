import { FC, useContext, useEffect, useMemo } from "react";
import Dropdown from "antd/lib/dropdown";
import Button from "antd/lib/button";
import Menu from "antd/lib/menu";
import { DownOutlined } from "@ant-design/icons";
import { InstituteSelectorCtx } from "../../services/context/institute-selector-ctx";
import { useRouter } from "next/router";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";
import type { MenuProps } from "antd";

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
      setInstitute(null);
      if (router.asPath !== "/" && router.pathname !== "/") {
        router.replace("/");
      }
    }
  }, [instituteSelection, router, setInstitute]);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    const selectedInstitute = instituteSelection.find(
      (institute) => String(institute.id) === String(e.key)
    );
    if (selectedInstitute && selectedInstitute.urlIdentifier) {
      setInstitute(selectedInstitute);
      const nextPath =
        router.pathname === "/"
          ? `/${selectedInstitute.urlIdentifier}`
          : router.asPath.replace(
              /^\/[^/]+/,
              `/${selectedInstitute.urlIdentifier}`
            );
      if (nextPath !== router.asPath) {
        router.push(nextPath);
      }
    } else {
      console.error("Selected institute does not have a valid URL identifier.");
    }
  };
  const filteredInstitutes = useMemo(
    () =>
      instituteSelection
        .map((m) => ({...m, key: m.id, name: m.name}))
        .filter((m) => (m.is_active)),
    [instituteSelection]
  );
  const menuItems: MenuProps["items"] = filteredInstitutes.map((item) => ({
    key: String(item.id),
    label: item.name,
  }));

  return (
    <Dropdown
      overlay={<Menu items={menuItems} onClick={handleMenuClick} />}
      disabled={loading}
    >
      <Button>
        {institute?.name || "Select Institute"} <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default InstituteSelector;
