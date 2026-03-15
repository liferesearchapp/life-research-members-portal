import { FC, useContext, useEffect, useMemo, useState } from "react";
import Dropdown from "antd/lib/dropdown";
import Menu from "antd/lib/menu";
import Button from "antd/lib/button";
import { DownOutlined } from "@ant-design/icons";
import { InstituteSelectorCtx } from "../../services/context/institute-selector-ctx";
import { useRouter } from "next/router";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";
import Notification from "../../services/notifications/notification";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";

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
      if ((router.asPath = "/")) {
        router.push(`/${selectedInstitute.urlIdentifier}`);
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
  const menu = (
    <Menu onClick={handleMenuClick}>
      {filteredInstitutes.map((institute) => (
        <Menu.Item key={institute.id}>{institute.name}</Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} disabled={loading}>
      <Button>
        {institute?.name || "Select Institute"} <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default InstituteSelector;
