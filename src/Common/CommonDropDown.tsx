import React, { useEffect, useState } from "react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import axios from "axios";

/* ---------------- TYPES ---------------- */

export type ValueType = string | number;

interface CommonDropdownProps<T extends Record<string, string>> {
  label: string;
  valueKey: keyof T;
  labelKey: keyof T;
  value: T | T[] | null;
  onChange: (value: T | T[] | null) => void;
  defaultValue?: T | T[] | null;
  options?: T[];
  apiUrl?: string;
  apiSearch?: boolean;
  pageSize?: number;
  readOnly?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/* ---------------- COMPONENT ---------------- */

function CommonDropdown<T extends Record<string, string>>({
  label,
  valueKey,
  labelKey,
  value,
  onChange,
  options = [],
  apiUrl,
  apiSearch = false,
  pageSize = 10,
  multiple = false,
  disabled = false,
  readOnly = false,
  placeholder,
}: CommonDropdownProps<T>) {
  const [data, setData] = useState<T[]>(options);
  const [loading, setLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  /* ---------------- API CALL ---------------- */

  const fetchData = async (reset = false): Promise<void> => {
    if (!apiUrl || loading || (!hasMore && !reset)) return;

    setLoading(true);

    try {
      const res = await axios.get(apiUrl, {
        params: {
          page: reset ? 1 : page,
          page_size: pageSize,
          search: apiSearch ? search : undefined,
        },
      });

      const items: T[] = res.data?.data ?? res.data;

      setData((prev) => (reset ? items : [...prev, ...items]));
      setHasMore(items.length === pageSize);
      setPage(reset ? 2 : page + 1);
    } catch (error) {
      console.error("Dropdown API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiUrl) fetchData(true);
  }, [apiUrl]);

  useEffect(() => {
    if (!apiSearch) return;

    const delay = setTimeout(() => {
      fetchData(true);
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  return (
    <Autocomplete<T, boolean, false, false>
      multiple={multiple}
      options={data}
      value={value}
      disableCloseOnSelect={multiple}
      readOnly={readOnly}
      disabled={disabled}
      loading={loading}
      getOptionLabel={(option: T) => String(option[labelKey])}
      isOptionEqualToValue={(option: T, val: T) =>
        option[valueKey] === val[valueKey]
      }
      onChange={(_, newValue) => onChange(newValue)}
      onInputChange={(_, newInput) => {
        if (apiSearch) setSearch(newInput);
      }}
      ListboxProps={{
        onScroll: (event: React.UIEvent<HTMLUListElement>) => {
          const listboxNode = event.currentTarget;
          if (
            listboxNode.scrollTop + listboxNode.clientHeight >=
            listboxNode.scrollHeight - 10
          ) {
            fetchData();
          }
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress size={18} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

export default CommonDropdown;
