//This component is a form element that allows a user to search for existing products and select one or more of them.

import React, { FC, useContext, useEffect, useState } from "react";
import type { product } from "@prisma/client";
import { ProductsCtx } from "../../services/context/products-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import AutoComplete from "antd/lib/auto-complete";
import type { ProductPublicInfo } from "../../services/_types";
import ProductTag from "./product-tag";
import { Card } from "antd";

type Props = {
  id?: string;
  value?: Map<number, product>;
  onChange?: (value: Map<number, product>) => void;
  setErrors?: (e: string[] | undefined) => void;
  max?: number;
};

const ProductSelector: FC<Props> = ({
  id = "",
  value = new Map<number, product>(),
  max = 10,
  onChange = () => {},
  setErrors = () => {},
}) => {
  const { products, refresh: refreshProducts, set } = useContext(ProductsCtx);
  const { en } = useContext(LanguageCtx);

  const [selectedValue, setSelectedValue] = useState("");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    refreshProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getOption(p: product) {
    let labelAndValue = "";
    if (en) {
      if (p.title_en) labelAndValue += p.title_en;
      if (p.title_en && p.title_fr) labelAndValue += " / ";
      if (p.title_fr) labelAndValue += p.title_fr;
    }
    if (!en) {
      if (p.title_fr) labelAndValue += p.title_fr;
      if (p.title_fr && p.title_en) labelAndValue += " / ";
      if (p.title_en) labelAndValue += p.title_en;
    }
    return { label: labelAndValue, value: labelAndValue, product: p };
  }

  const options = products
    .map((p) => getOption(p))
    .sort((a, b) => a.label.localeCompare(b.label));

  function clearState() {
    setSelectedValue("");
    setSearchValue("");
  }

  function onSelect(optionValue: string, option: (typeof options)[number]) {
    clearState();
    addToList(option.product);
  }

  function addToList(product: product) {
    if (!value.has(product.id) && value.size >= max)
      return setErrors?.([`Maximum ${max}`]);
    onChange?.(new Map(value).set(product.id, product));
  }

  function onDelete(id: number) {
    const next = new Map(value);
    next.delete(id);
    onChange(next);
    setErrors(undefined);
  }

  function onEdit(updatedProduct: product) {
    set(updatedProduct);
    onChange(new Map(value).set(updatedProduct.id, updatedProduct));
  }

  return (
    <>
      <div className="product-selector">
        <div className="header">
          <AutoComplete
            id={id}
            className="autocomplete"
            placeholder={en ? "Search Existing..." : "Rechercher..."}
            options={options}
            value={selectedValue}
            onChange={setSelectedValue}
            filterOption
            notFoundContent={en ? "No Matches" : "Pas de correspondance"}
            onSelect={onSelect}
            onSearch={setSearchValue}
          />
        </div>
        <Card className="tag-viewport" size="small">
          {Array.from(value.values()).map((p) => (
            <ProductTag
              key={p.id}
              product={p}
              editable
              deletable
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </Card>
      </div>
    </>
  );
};

export default ProductSelector;
