import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavMenu from "../../src/components/navbar/nav-menu";
import { ActiveAccountCtx } from "../../src/services/context/active-account-ctx";
import { LanguageCtx } from "../../src/services/context/language-ctx";
import { SaveChangesCtx } from "../../src/services/context/save-changes-ctx";
import type { AccountInfo } from "../../src/services/_types";

/**
 * `buildNavItems` already has pure unit tests for the role -> menu mapping. What is untested, and
 * what this file covers, is everything NavMenu adds on top of it: that the items reach the DOM as
 * links at all, and the active-route detection, including the branch where a submenu parent is
 * highlighted because one of its children matches.
 */

// The route under test. Read through a live getter so a test can set it before rendering.
let pathname = "/alpha";
vi.mock("next/router", () => ({
  useRouter: () => ({ pathname, push: vi.fn(), prefetch: vi.fn(), asPath: pathname }),
}));

// Institute membership resolution belongs to SelectedInstituteCtx, whose context object is not
// exported, so the two hooks are stubbed rather than driven through a provider. NavMenu imports
// nothing else from this module.
let isAdmin = false;
let isMember = false;
vi.mock("../../src/services/context/selected-institute-ctx", () => ({
  useAdminDetails: () => isAdmin,
  useMemberDetails: () => isMember,
}));

type Options = {
  urlIdentifier?: string;
  superAdmin?: boolean;
  admin?: boolean;
  member?: boolean;
  loading?: boolean;
  signedIn?: boolean;
  en?: boolean;
  route?: string;
};

function renderNav(o: Options = {}) {
  isAdmin = o.admin ?? false;
  isMember = o.member ?? false;
  pathname = o.route ?? "/alpha";

  const localAccount = o.signedIn === false
    ? null
    : ({
        is_super_admin: o.superAdmin ?? false,
        instituteAdmin: o.admin ? [{ instituteId: 1 }] : [],
        member: { institutes: o.member ? [{ instituteId: 1 }] : [] },
      } as unknown as AccountInfo);

  const activeAccount = {
    localAccount,
    loading: o.loading ?? false,
    refresh: vi.fn(),
    refreshing: false,
    login: vi.fn(),
    logout: vi.fn(),
    setLocalAccount: vi.fn(),
  };

  const saveChanges = {
    dirty: false,
    setDirty: vi.fn(),
    setSubmit: vi.fn(),
    // The real prompt opens a modal; here it just lets navigation through.
    saveChangesPrompt: ({ onSuccessOrDiscard }: { onSuccessOrDiscard: () => void }) =>
      onSuccessOrDiscard(),
  };

  const tree: ReactElement = (
    <ActiveAccountCtx.Provider value={activeAccount}>
      <LanguageCtx.Provider value={{ en: o.en ?? true, toggleLanguage: vi.fn() }}>
        <SaveChangesCtx.Provider value={saveChanges}>
          <NavMenu urlIdentifier={"urlIdentifier" in o ? o.urlIdentifier : "alpha"} />
        </SaveChangesCtx.Provider>
      </LanguageCtx.Provider>
    </ActiveAccountCtx.Provider>
  );

  return render(tree);
}

/** The label of whichever top-level menu item antd marks as selected. */
function selectedLabel(container: HTMLElement) {
  const selected = container.querySelector(".ant-menu-item-selected, .ant-menu-submenu-selected");
  return selected?.textContent ?? null;
}

beforeEach(() => {
  pathname = "/alpha";
  isAdmin = false;
  isMember = false;
});

describe("NavMenu", () => {
  it("renders nothing when there is no institute and no access to one", () => {
    const { container } = renderNav({ urlIdentifier: undefined, signedIn: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the member links as real anchors", () => {
    renderNav({ member: true });

    expect(screen.getByText("Members").closest("a")).toHaveAttribute("href", "/alpha/members");
    expect(screen.getByText("Products").closest("a")).toHaveAttribute("href", "/alpha/products");
    expect(screen.queryByText("Grants")).toBeNull();
  });

  it("gives a super admin the Reports submenu", () => {
    renderNav({ superAdmin: true, admin: true });

    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Grants")).toBeInTheDocument();
  });

  it("renders French labels when the language context says so", () => {
    renderNav({ member: true, en: false });

    expect(screen.getByText("Membres")).toBeInTheDocument();
    expect(screen.queryByText("Members")).toBeNull();
  });

  it("marks the item matching the current route as selected", () => {
    const { container } = renderNav({ member: true, route: "/alpha/products" });

    expect(selectedLabel(container)).toBe("Products");
  });

  it("marks a submenu parent selected when the route matches one of its children", () => {
    // /admin-reports is a child of Reports, never a top-level item -- this is the branch that
    // walks `item.children` and is invisible to the pure nav-items tests.
    const { container } = renderNav({ superAdmin: true, admin: true, route: "/admin-reports" });

    expect(selectedLabel(container)).toBe("Reports");
  });

  it("selects nothing on a route that is not in the menu", () => {
    const { container } = renderNav({ member: true, route: "/alpha/some/other/page" });

    expect(selectedLabel(container)).toBeNull();
  });

  it("shows a loading indicator and withholds the links while the account is loading", () => {
    const { container } = renderNav({ member: true, loading: true });

    expect(container.querySelector(".ant-spin")).toBeInTheDocument();
    expect(screen.queryByText("Members")).toBeNull();
  });
});
