import { FC, useContext, useEffect, useState } from "react";
import Dropdown from "antd/lib/dropdown";
import Menu from "antd/lib/menu";
import Button from "antd/lib/button";
import { DownOutlined } from "@ant-design/icons";
import { MemberInstituteCtx } from "../../services/context/member-institutes-ctx";
import { useRouter } from "next/router";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";
import Notification from "../../services/notifications/notification";

const InstituteSelector: FC = () => {
  const { institutes, loading } = useContext(MemberInstituteCtx);
  const { institute, setInstitute } = useSelectedInstitute();
  const router = useRouter();

  useEffect(() => {
    const currentInstituteUrlIdentifier = router.query.instituteId;
    if (!currentInstituteUrlIdentifier) return;
    const currentInstitute = institutes.find(
      (institute) => institute.urlIdentifier === currentInstituteUrlIdentifier
    );

    if (currentInstitute) {
      setInstitute(currentInstitute);
    } else if (institutes.length > 0 && !currentInstitute) {
      const notification = new Notification();
      console.log("Pushing to home page", currentInstitute, institutes);
      setInstitute(null);
      router.push("/");
    }
  }, [institutes, router, setInstitute]);

  const handleMenuClick = (e: any) => {
    const selectedInstitute = institutes.find(
      (institute) => String(institute.id) === String(e.key)
    );
    if (selectedInstitute && selectedInstitute.urlIdentifier) {
      setInstitute(selectedInstitute);
      // router.push(`/${selectedInstitute.urlIdentifier}`);
    } else {
      console.error("Selected institute does not have a valid URL identifier.");
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      {institutes.map((institute) => (
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
