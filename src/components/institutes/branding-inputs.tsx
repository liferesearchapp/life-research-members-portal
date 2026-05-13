/* eslint-disable @next/next/no-img-element */
import Button from "antd/lib/button";
import Input from "antd/lib/input";
import Text from "antd/lib/typography/Text";
import { type ChangeEvent, type FC, useId, useRef } from "react";
import Notification from "../../services/notifications/notification";

type BrandingImageInputProps = {
  value?: string | null;
  onChange?: (value: string | null) => void;
  fallbackSrc: string;
  alt: string;
  helpText?: string;
};

type BrandColorInputProps = {
  value?: string | null;
  onChange?: (value: string | null) => void;
  fallbackColor: string;
};

const MAX_FILE_SIZE_BYTES = 750_000;
const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

function normalizeColor(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) return trimmed;
  return `#${trimmed}`;
}

export const BrandingImageInput: FC<BrandingImageInputProps> = ({
  value,
  onChange,
  fallbackSrc,
  alt,
  helpText,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const previewSrc = value || fallbackSrc;

  async function onFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      new Notification().error(
        "Please upload a PNG, JPG, WEBP, or SVG image."
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      new Notification().error("Please keep branding images under 750KB.");
      e.target.value = "";
      return;
    }

    try {
      onChange?.(await readFileAsDataUrl(file));
    } catch (error: any) {
      new Notification().error(error);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          border: "1px solid #e8e8e8",
          borderRadius: 8,
          padding: 12,
          minHeight: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
        }}
      >
        <img
          src={previewSrc}
          alt={alt}
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: 140,
            objectFit: "contain",
          }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button type="default" onClick={() => inputRef.current?.click()}>
          Upload image
        </Button>
        {value ? (
          <Button onClick={() => onChange?.(null)}>Use default</Button>
        ) : null}
      </div>
      {helpText ? <Text type="secondary">{helpText}</Text> : null}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        style={{ display: "none" }}
        onChange={onFileSelected}
      />
    </div>
  );
};

export const BrandColorInput: FC<BrandColorInputProps> = ({
  value,
  onChange,
  fallbackColor,
}) => {
  const normalizedValue = normalizeColor(value);
  const previewColor = normalizedValue || fallbackColor;

  function updateValue(next: string) {
    const normalized = normalizeColor(next);
    onChange?.(normalized || null);
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
      }}
    >
      <input
        type="color"
        value={previewColor}
        onChange={(e) => updateValue(e.target.value)}
        style={{
          width: 56,
          height: 40,
          border: "1px solid #d9d9d9",
          borderRadius: 8,
          padding: 4,
          background: "#fff",
          cursor: "pointer",
        }}
      />
      <Input
        value={normalizedValue || ""}
        placeholder={fallbackColor}
        onChange={(e) => updateValue(e.target.value)}
        style={{ flex: "1 1 180px", minWidth: 180 }}
      />
      {value ? (
        <Button onClick={() => onChange?.(null)}>Use default</Button>
      ) : null}
    </div>
  );
};
