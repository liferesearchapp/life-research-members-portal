// ProductTitleFilter - A component for filtering products by title
// Uses the context `AllProductsCtx` to retrieve a list of all products
// Uses the context `LanguageCtx` to determine the language for the title

import Select, { SelectProps } from "antd/lib/select";
import { type FC, useContext, useMemo } from "react";
import { LanguageCtx } from "../../services/context/language-ctx";
import { AllProductsCtx } from "../../services/context/all-products-ctx";
import type { ProductPublicInfo } from "../../services/_types";
import fuzzyIncludes from "../../utils/front-end/fuzzy-includes";

function getTitle(product: ProductPublicInfo, en: boolean) {
  return en ? product.title_en : product.title_fr;
}

type Props = {
  id?: string;
  value?: Set<number>;
  onChange?: (value: Set<number>) => void;
  getPopupContainer?: SelectProps["getPopupContainer"];
};

const ProductTitleFilter: FC<Props> = ({
  id,
  value = new Set<number>(),
  onChange = () => {},
  getPopupContainer,
}) => {
  const { allProducts } = useContext(AllProductsCtx);
  const { en } = useContext(LanguageCtx);

  const valueArray = useMemo(() => Array.from(value.values()), [value]);

  const options = useMemo(
    () => allProducts.map((m) => ({ label: getTitle(m, en), value: m.id })),
    [allProducts, en]
  );

  function onSelect(id: number) {
    value.add(id);
    onChange(value);
  }

  function onDelete(id: number) {
    value.delete(id);
    onChange(value);
  }

  function filterOption(
    input: string,
    option?: (typeof options)[number]
  ): boolean {
    if (!option) return false;
    return fuzzyIncludes(option.label, input);
  }

  return (
    <Select
      id={id}
      className="product-title-filter"
      value={valueArray}
      filterOption={filterOption}
      mode="multiple"
      options={options}
      allowClear
      onSelect={onSelect}
      onDeselect={onDelete}
      getPopupContainer={getPopupContainer}
    ></Select>
  );
};

export default ProductTitleFilter;
