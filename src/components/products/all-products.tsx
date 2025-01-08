// This is a component that displays a table of products , with filters to filter the products based on their title, types, authors.
// The component also has buttons ta add a new product and clear the filters.
// The component also updates the URL query parameters based on the filter values and the query parameters are used to update the filters on component mount.

import Button from "antd/lib/button";
import Table, { ColumnType } from "antd/lib/table";
import Title from "antd/lib/typography/Title";
import {
  FC,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { ProductPublicInfo } from "../../services/_types";
import type { MemberPublicInfo } from "../../services/_types";
import PageRoutes from "../../routing/page-routes";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import SafeLink from "../link/safe-link";
import Router, { useRouter } from "next/router";
import Form from "antd/lib/form";
import blurActiveElement from "../../utils/front-end/blur-active-element";
import { Checkbox, Tag } from "antd";
import ProductTitleFilter from "../filters/product-title-filter";
import ProductTypeFilter from "../filters/product-type-filter";
import type { ParsedUrlQueryInput } from "querystring";
import { AllProductsCtx } from "../../services/context/all-products-ctx";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import type { PublicMemberRes } from "../../pages/api/member/[id]/public";
import colorFromString from "../../utils/front-end/color-from-string";
import ProductAllAuthorFilter from "../filters/product-all-author-filter";
import getMemberAuthor from "../getters/product-member-author-getter";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

function getTitle(product: ProductPublicInfo, en: boolean) {
  return en ? product.title_en : product.title_fr;
}

function filterFn(
  m: ProductPublicInfo & { product: string },
  filters: {
    productTitleFilter: Set<number>;
    productTypesFilter: Set<number>;
    productAllAuthorsFilter: Set<string>;
  }
): boolean {
  const { productTitleFilter, productTypesFilter, productAllAuthorsFilter } =
    filters;

  if (productTitleFilter.size > 0 && !productTitleFilter.has(m.id))
    return false;

  if (productTypesFilter.size > 0) {
    if (!m.product_type && !productTypesFilter.has(0)) return false; // id 0 is for null
    if (m.product_type && !productTypesFilter.has(m.product_type.id))
      return false;
  }

  if (productAllAuthorsFilter.size > 0) {
    const authorNames = productAllAuthorsFilter;
    const allAuthorNames = new Set(
      m.all_author!.split(/(?:,|;|&)(?!\s\w\.)/).map((author) => author.trim())
    );
    const intersection = new Set(
      [...authorNames].filter((name) => allAuthorNames.has(name))
    );

    if (intersection.size === 0) return false;
  }

  return true;
}

// Use query params for filters - for bookmarking, back button etc.
export const queryKeys = {
  showType: "showType",
  showAllAuthor: "showAllAuthor",
  showMemberAuthor: "showMemberAuthor",
  showDoi: "showDoi",
  productTitle: "productTitle",
  productAllAuthor: "productAllAuthor",
  productTypes: "productTypes",
  targets: "targets",
} as const;

// Don't want to change url if query is default value
const defaultQueries = {
  showDoi: true,
  showType: true,
  showMemberAuthor: true,
  showAllAuthor: false,
} as const;

function handleShowDoiChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showDoi]: value,
  };
  if (value === defaultQueries.showDoi) delete query[queryKeys.showDoi];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowAllAuthorChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showAllAuthor]: value,
  };
  if (value === defaultQueries.showAllAuthor)
    delete query[queryKeys.showAllAuthor];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowMemberAuthorChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showMemberAuthor]: value,
  };
  if (value === defaultQueries.showMemberAuthor)
    delete query[queryKeys.showMemberAuthor];
  Router.push({ query }, undefined, { scroll: false });
}

function handleShowTypeChange(value: boolean) {
  const query: ParsedUrlQueryInput = {
    ...Router.query,
    [queryKeys.showType]: value,
  };
  if (value === defaultQueries.showType) delete query[queryKeys.showType];
  Router.push({ query }, undefined, { scroll: false });
}

function handleProductTitleFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.productTitle]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function handleProductTypeFilterChange(next: Set<number>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.productTypes]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}
function handleProductAllAuthorFilterChange(next: Set<string>) {
  Router.push(
    {
      query: {
        ...Router.query,
        [queryKeys.productAllAuthor]: Array.from(next.keys()),
      },
    },
    undefined,
    { scroll: false }
  );
}

function clearQueries(institute: { urlIdentifier: string | null }) {
  if (institute?.urlIdentifier) {
    const url = PageRoutes.allProducts(institute.urlIdentifier);
    console.log("Redirecting to:", url); 
    Router.push(url); 
  } else {
    console.error("Unable to reset filters: Institute ID is missing.");
    alert("Unable to reset filters: Institute ID is missing.");
  }
}

function getIdsFromQueryParams(key: string): Set<number> {
  const res = new Set<number>();
  const query = Router.query[key];
  if (!query) return res;
  if (typeof query === "string") {
    const id = parseInt(query);
    if (!isNaN(id)) res.add(id);
  } else {
    for (const keyword of query) {
      const id = parseInt(keyword);
      if (!isNaN(id)) res.add(id);
    }
  }
  return res;
}

function getIdsFromQueryParams2(key: string): Set<string> {
  const res = new Set<string>();
  const query = Router.query[key];
  if (!query) return res;
  if (typeof query === "string") {
    res.add(query);
  } else {
    for (const keyword of query) {
      res.add(keyword);
    }
  }
  return res;
}

function getPopupContainer(): HTMLElement {
  return (
    document.querySelector(".all-products-table .filters") || document.body
  );
}

const AllProducts: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();
  const {
    allProducts,
    loading,
    refresh: refreshProducts,
  } = useContext(AllProductsCtx);

  const handleRegisterProduct = () => {
    if (institute) {
      router.push({
         pathname: "/[instituteId]/products/register",
         query: { instituteId: institute.urlIdentifier },
      });
    }
  };

  useEffect(() => {
    refreshProducts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showDoi, setShowDoi] = useState<boolean>(defaultQueries.showDoi);
  const [showType, setShowType] = useState<boolean>(defaultQueries.showType);

  const [showAllAuthor, setShowAllAuthor] = useState<boolean>(
    defaultQueries.showAllAuthor
  );

  const [showMemberAuthor, setShowMemberAuthor] = useState<boolean>(
    defaultQueries.showMemberAuthor
  );

  const { localAccount } = useContext(ActiveAccountCtx);

  const [productTitleFilter, setProductTitleFilter] = useState(
    new Set<number>()
  );
  const [productAllAuthorsFilter, setProductAllAuthorFilter] = useState(
    new Set<string>()
  );
  const [productTypesFilter, setProductTypesFilter] = useState(
    new Set<number>()
  );

  const router = useRouter();

  const showTypeQuery = router.query[queryKeys.showType];
  const showAllAuthorQuery = router.query[queryKeys.showAllAuthor];
  const showMemberAuthorQuery = router.query[queryKeys.showMemberAuthor];
  const showDoiQuery = router.query[queryKeys.showDoi];
  const productTitleQuery = router.query[queryKeys.productTitle];
  const productAuthorQuery = router.query[queryKeys.productAllAuthor];
  const productTypesQuery = router.query[queryKeys.productTypes];

  useEffect(() => {
    if (!showTypeQuery) setShowType(defaultQueries.showType);
    if (showTypeQuery === "true") setShowType(true);
    if (showTypeQuery === "false") setShowType(false);
  }, [showTypeQuery]);

  useEffect(() => {
    if (!showDoiQuery) setShowDoi(defaultQueries.showDoi);
    if (showDoiQuery === "true") setShowDoi(true);
    if (showDoiQuery === "false") setShowDoi(false);
  }, [showDoiQuery]);

  useEffect(() => {
    if (!showAllAuthorQuery) setShowAllAuthor(defaultQueries.showAllAuthor);
    if (showAllAuthorQuery === "true") setShowAllAuthor(true);
    if (showAllAuthorQuery === "false") setShowAllAuthor(false);
  }, [showAllAuthorQuery]);

  useEffect(() => {
    if (!showMemberAuthorQuery)
      setShowMemberAuthor(defaultQueries.showMemberAuthor);
    if (showMemberAuthorQuery === "true") setShowMemberAuthor(true);
    if (showMemberAuthorQuery === "false") setShowMemberAuthor(false);
  }, [showMemberAuthorQuery]);

  useEffect(() => {
    setProductTitleFilter(getIdsFromQueryParams(queryKeys.productTitle));
  }, [productTitleQuery]);

  useEffect(() => {
    setProductAllAuthorFilter(
      getIdsFromQueryParams2(queryKeys.productAllAuthor)
    );
  }, [productAuthorQuery]);

  useEffect(() => {
    setProductTypesFilter(getIdsFromQueryParams(queryKeys.productTypes));
  }, [productTypesQuery]);

  function refreshAndClearFilters() {
    const instituteUrlIdentifier = institute?.urlIdentifier; // Retrieve urlIdentifier instead of id
    if (instituteUrlIdentifier) {
    clearQueries({ urlIdentifier: instituteUrlIdentifier }); // Pass as an object
    refreshProducts();
  } else {
    console.error("Cannot reset filters: Institute ID is missing.");
  }
  }

  const filteredProducts = useMemo(
    () =>
      allProducts
        .map((m) => ({ ...m, key: m.id, product: getTitle(m, en) }))
        .filter((m) =>
          filterFn(m, {
            productTitleFilter,
            productTypesFilter,
            productAllAuthorsFilter,
          })
        ),
    [
      allProducts,
      productTitleFilter,
      productAllAuthorsFilter,
      productTypesFilter,

      en,
    ]
  );

  type ProductColumnType = ColumnType<(typeof filteredProducts)[number]>;

  const nameColumn: ProductColumnType = useMemo(
    () => ({
      title: en ? "Title" : "Titre",
      dataIndex: "product",
      className: "title-column",

      render: (value, product) => (
        <SafeLink href={PageRoutes.productProfile(product.id)}>
          {value}
        </SafeLink>
      ),
    }),
    [en]
  );

  const doiColumn: ProductColumnType = useMemo(
    () => ({
      title: en ? "DOI" : "DOI",
      dataIndex: "doi",
      className: "name-column",
      render: (doi: string) => (
        <SafeLink href={`https://doi.org/${doi}`} external>
          {doi}
        </SafeLink>
      ),
    }),
    [en]
  );

  const productTypeColumn: ProductColumnType = useMemo(
    () => ({
      title: en ? "Product Type" : "Type de produit",
      dataIndex: ["product_type", en ? "name_en" : "name_fr"],
      className: "type-column",
      sorter: en
        ? (a, b) =>
            (a.product_type?.name_en || "").localeCompare(
              b.product_type?.name_en || ""
            )
        : (a, b) =>
            (a.product_type?.name_fr || "").localeCompare(
              b.product_type?.name_fr || ""
            ),
    }),
    [en]
  );

  const productAllAuthorColumn: ProductColumnType = useMemo(
    () => ({
      title: en ? "All Authors" : "Tous les auteurs",
      dataIndex: "all_author",
      className: "name-column",
      render: (all_author: string) => <span>{all_author}</span>,
    }),
    [en]
  );

  const productMemberAuthorColumn: ProductColumnType = useMemo(() => {
    return {
      title: en ? "Authors Member" : "Auteurs membres",
      dataIndex: "product_member_author",
      key: "product_member_author",
      render: (
        product_member_author: Array<{
          member: {
            id: number;
            account: { first_name: string; last_name: string };
          };
        }>
      ) => {
        return <div>{getMemberAuthor(product_member_author)}</div>;
      },
    };
  }, [en]);

  const columns: ProductColumnType[] = [nameColumn];
  if (showDoi) columns.push(doiColumn);
  if (showType) columns.push(productTypeColumn);
  if (showMemberAuthor) columns.push(productMemberAuthorColumn);
  if (showAllAuthor) columns.push(productAllAuthorColumn);

  const filters = (
    <Form
      onFinish={blurActiveElement}
      className="filters"
      labelAlign="left"
      size="small"
    >
      <Form.Item
        label={en ? "Filter by title" : "Filtrer par titre"}
        htmlFor="title-filter"
      >
        <ProductTitleFilter
          id="title-filter"
          value={productTitleFilter}
          onChange={handleProductTitleFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>

      <Form.Item
        label={en ? "Filter by type" : "Filtrer par type"}
        htmlFor="product-type-filter"
      >
        <ProductTypeFilter
          id="product-type-filter"
          value={productTypesFilter}
          onChange={handleProductTypeFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>

      <Form.Item
        label={en ? "Filter by authors" : "Filtrer par auteurs"}
        htmlFor="all-authors-filter"
      >
        <ProductAllAuthorFilter
          id="all-authors-filter"
          value={productAllAuthorsFilter}
          onChange={handleProductAllAuthorFilterChange}
          getPopupContainer={getPopupContainer}
        />
      </Form.Item>

      <label htmlFor="show-column-checkboxes">
        {en ? "Show Columns:" : "Afficher les colonnes:"}
      </label>
      <span className="show-column-checkboxes" id="show-column-checkboxes">
        <Checkbox
          checked={showDoi}
          onChange={(e) => handleShowDoiChange(e.target.checked)}
        >
          {en ? "Show Product DOI" : "Afficher le DOI"}
        </Checkbox>

        <Checkbox
          checked={showType}
          onChange={(e) => handleShowTypeChange(e.target.checked)}
        >
          {en ? "Show Product Type" : "Afficher le type de produit"}
        </Checkbox>

        <Checkbox
          checked={showMemberAuthor}
          onChange={(e) => handleShowMemberAuthorChange(e.target.checked)}
        >
          {en ? "Show Member Authors" : "Afficher les auteurs membres"}
        </Checkbox>
        <Checkbox
          checked={showAllAuthor}
          onChange={(e) => handleShowAllAuthorChange(e.target.checked)}
        >
          {en ? "Show all Authors" : "Afficher tous les auteurs"}
        </Checkbox>
      </span>
    </Form>
  );

  const Header = () => (
    <>
      <div className="header-title-row">
        <Title level={1}>{en ? "All Products" : "Tous les produits"}</Title>
        <Button type="primary" onClick={refreshAndClearFilters} size="large">
          {en ? "Reset" : "Réinitialiser"}
        </Button>

        {localAccount && (
          <Button
            type="primary"
            size="large"
            onClick={() => handleRegisterProduct()}
          >
            {en ? "Add a new product" : "Ajouter un nouveau produit"}
          </Button>
        )}
      </div>
      {filters}
    </>
  );

  const expandedRowRender = (product: ProductPublicInfo) => (
    <Descriptions size="small" layout="vertical" className="problems-container">
      <Item label={en ? "Abstract" : "Résumé"}>{product.note}</Item>
    </Descriptions>
  );

  return (
    <Table
      className="all-members-table"
      size="small"
      tableLayout="auto"
      columns={columns}
      dataSource={filteredProducts}
      loading={loading}
      title={Header}
      pagination={false}
      showSorterTooltip={false}
      sticky={{ offsetHeader: 74 }}
      scroll={{ x: true }}
      rowClassName={(_, index) =>
        "table-row " + (index % 2 === 0 ? "even" : "odd")
      }
      expandable={{
        expandedRowRender,
        expandedRowClassName: (_, index) =>
          "expanded-table-row " + (index % 2 === 0 ? "even" : "odd"),
        rowExpandable: (m) => !!m.note && m.note.length > 0,
      }}
    />
  );
};

export default AllProducts;
