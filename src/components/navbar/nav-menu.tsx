import MenuOutlined from "@ant-design/icons/lib/icons/MenuOutlined";
import Menu from "antd/lib/menu";
import Spin from "antd/lib/spin";
import { useRouter } from "next/router";
import {
  type ComponentProps,
  FC,
  type ReactNode,
  useContext,
} from "react";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import SafeLink from "../link/safe-link";
import type { UrlObject } from "url";
import { useAdminDetails, useMemberDetails } from "../../services/context/selected-institute-ctx";
import { buildNavItems } from "./nav-items";

type MenuItemType = NonNullable<ComponentProps<typeof Menu>["items"]>[number];

const NavMenu: FC<{ urlIdentifier: string | undefined }> = ({
  urlIdentifier,
}) => {
  const { localAccount, loading } = useContext(ActiveAccountCtx);
  const router = useRouter();
  const { en } = useContext(LanguageCtx);
  const isAdmin = useAdminDetails();
  const isMember = useMemberDetails();
  const isSuperAdmin = !!localAccount?.is_super_admin;
  const hasInstituteAccess =
    isSuperAdmin ||
    (localAccount?.instituteAdmin.length || 0) > 0 ||
    (localAccount?.member?.institutes.length || 0) > 0;
  const canAccessAdminPages = !!isAdmin || isSuperAdmin;
  const canAccessMemberPages = !!isMember || canAccessAdminPages;

  if (!urlIdentifier && !hasInstituteAccess) return null;

  const items = buildNavItems({
    urlIdentifier,
    en,
    loading,
    canAccessMemberPages,
    canAccessAdminPages,
    isSuperAdmin,
    hasInstituteAccess,
    hasLocalAccount: !!localAccount,
  });

  function isMenuItemActive(item: { href: string; children?: any }): boolean {
    if (router.pathname === item.href) {
      return true;
    }

    if (item.children) {
      return item.children.some(
        (child: { href: string }) => router.pathname === child.href
      );
    }

    return false;
  }

  const activeItem = items.find(isMenuItemActive);

  const menuItems: MenuItemType[] = items.map((it) => {
    if (it.children) {
      return {
        label: it.label,
        key: it.label,
        children: it.children.map(
          (child: {
            href: string | UrlObject;
            label: ReactNode;
          }) => ({
            label: <SafeLink href={child.href}>{child.label}</SafeLink>,
            key: child.label,
          })
        ),
      };
    } else {
      return {
        label: <SafeLink href={it.href}>{it.label}</SafeLink>,
        key: it.label,
      };
    }
  });

  if (loading) menuItems.push({ label: <Spin />, key: "loading" });

  return (
    <div className="nav-menu">
      <Menu
        items={menuItems}
        mode="horizontal"
        overflowedIndicator={<MenuOutlined className="collapsed-icon" />}
        style={{ fontSize: "inherit" }}
        selectedKeys={activeItem ? [activeItem.label] : []}
        getPopupContainer={() =>
          document.querySelector(".navbar") || document.body
        }
      />
    </div>
  );
};

export default NavMenu;
