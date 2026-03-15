import dayjs, { type Dayjs } from "dayjs";

type DateValue = Date | string | null | undefined;

export default function toDayjsDate(value: DateValue): Dayjs | null {
  if (!value) return null;

  const normalizedValue =
    value instanceof Date ? value.toISOString().split("T")[0] : value.split("T")[0];

  return dayjs(normalizedValue);
}
