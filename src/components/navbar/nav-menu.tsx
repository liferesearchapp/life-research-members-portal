import MenuOutlined from "@ant-design/icons/lib/icons/MenuOutlined";
import Menu from "antd/lib/menu";
import type { MenuItemType } from "antd/lib/menu/hooks/useItems";
import Spin from "antd/lib/spin";
import { useRouter } from "next/router";
import {
  FC,
  JSXElementConstructor,
  ReactElement,
  ReactFragment,
  ReactPortal,
  useContext,
} from "react";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import PageRoutes from "../../routing/page-routes";
import SafeLink from "../link/safe-link";
import type { UrlObject } from "url";

const NavMenu: FC = () => {
  const { localAccount, loading } = useContext(ActiveAccountCtx);
  const router = useRouter();
  const { en } = useContext(LanguageCtx);

  // Everyone
  const generalItems = [
    { label: en ? "Home" : "Accueil", href: PageRoutes.home },
  ];

  // Registered Acounts
  const registeredItemsFirst = [
    { label: en ? "Members" : "Membres", href: PageRoutes.allMembers },
    { label: en ? "Products" : "Produits", href: PageRoutes.products },
    { label: en ? "Partners" : "Partenaires", href: PageRoutes.allPartners },
  ];

  // Registered Acounts
  const registeredItemsLast = [
    { label: en ? "My Profile" : "Mon profil", href: PageRoutes.myProfile },
  ];

  // Admins
  const adminItems = [
    { label: en ? "Grants" : "Subventions", href: PageRoutes.allGrants },
    { label: en ? "Our Events" : "Événements", href: PageRoutes.allEvents },
    {
      label: en ? "Supervisions" : "Supervisions",
      href: PageRoutes.allSupervisions,
    },

    {
      label: en ? "Accounts" : "Comptes",
      href: PageRoutes.allAccounts,
      children: [
        {
          label: en ? "All accounts" : "Tous les comptes",
          href: PageRoutes.allAccounts,
        },
        {
          label: en ? "Register an account" : "Enregistrer un compte",
          href: PageRoutes.register,
        },
      ],
    },
  ];

  const items: { label: string; href: string; children?: any }[] = generalItems;
  if (!loading) {
    if (localAccount) for (const it of registeredItemsFirst) items.push(it);
    if (localAccount?.is_admin) for (const it of adminItems) items.push(it);
    if (localAccount) for (const it of registeredItemsLast) items.push(it);
  }

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
            label:
              | string
              | number
              | boolean
              | ReactElement<any, string | JSXElementConstructor<any>>
              | ReactFragment
              | ReactPortal
              | null
              | undefined;
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
        activeKey={activeItem?.label}
        getPopupContainer={() =>
          document.querySelector(".navbar") || document.body
        }
      />
    </div>
  );
};

export default NavMenu;
