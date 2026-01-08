import React, { useEffect, useRef, useState } from "react";

type ValueType = string | number;

interface DropDownOptions {
  id: string | number;
  value?: string;
  title?: string;
  label?: string;
  [key: string]: unknown;
}
interface DropdownProps {
  options?: DropDownOptions[];
  apiUrl?: string;
  apiSearch?: boolean;
  labelKey: string;
  valueKey: string;
  searchKeys?: string[];
  placeholder?: string;
  multiple?: boolean;
  selectedValues: ValueType[];
  onChange: (values: ValueType[]) => void;
  pageSize?: number;
}

const authToken =
  "eyJhbGciOiJIUzI1NiIsImtleV9hY2Nlc3MiOiJzdWJzY3JpcHRpb25fYWNjZXNzIiwidHlwIjoiSldUIn0.eyJ1c2VybmFtZSI6InNtaXQudkB5b3BtYWlsLmNvbSIsImV4cCI6MTc2ODQ3NzA2NCwiaWF0IjoxNzY3NjEzMDY0LjU2NjMyLCJpZCI6IjdmNDM4NzY1LTNjN2ItNDhmZC04MzA3LWU0Y2EyYWIwYWU3NSIsImVtYWlsIjoic21pdC52QHlvcG1haWwuY29tIiwic3Vic2NyaXB0aW9uX2lkIjoiY2I3YjZhMzAtMzRiNC00MjVlLWI4ZTgtMWQwNDViY2Y2MjUyIn0.yaTMyh9T6N4xgzNDLEG9TSrP78PPu7Pyrt0bCX25fvY";

function Dropdown({
  options = [],
  apiUrl,
  apiSearch = false,
  labelKey,
  valueKey,
  searchKeys = [],
  placeholder = "Select...",
  multiple = false,
  selectedValues,
  pageSize = 10,
  onChange,
}: DropdownProps) {
  const isStatic = options.length > 0 && !apiUrl;

  const [items, setItems] = useState<any[]>(options);
  const [open, setOpen] = useState<boolean>(false);

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const PAGE_SIZE = pageSize;

  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update items if static options change
  useEffect(() => {
    if (isStatic) setItems(options);
  }, [isStatic, options]);

  // Debounce search input
  useEffect(() => {
    // Clear previous timer and start new one every time `search` changes
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400); // 400ms debounce delay

    return () => clearTimeout(timer);
  }, [search]);

  // Reset page and hasNext when search changes
  useEffect(() => {
    if (!apiSearch) return;
    setPage(1);
    setHasNext(true);
    setItems([]);
  }, [debouncedSearch, apiSearch]);

  // Fetch API data
  useEffect(() => {
    if (!apiSearch || !apiUrl || !open || isLoading) return;

    setIsLoading(true);

    fetch(
      `${apiUrl}?page=${page}&page_size=${PAGE_SIZE}&search=${encodeURIComponent(
        debouncedSearch
      )}`,
      {
        headers: authToken
          ? { Authorization: `Bearer ${authToken}` }
          : undefined,
      }
    )
      .then((res) => res.json())
      .then((data) => {
        let list = [];

        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.data)) list = data.data;
        else if (Array.isArray(data?.results)) list = data.results;

        setItems((prev) => (page === 1 ? list : [...prev, ...list]));
        setHasNext(list.length === PAGE_SIZE);
      })
      .catch(() => setHasNext(false))
      .finally(() => setIsLoading(false));
  }, [page, debouncedSearch, apiSearch, apiUrl, open]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - 20 &&
      hasNext &&
      !isLoading
    ) {
      setPage((p) => p + 1);
    }
  };

  const selectItem = (value: ValueType) => {
    if (multiple) onChange([...selectedValues, value]);
    else {
      onChange([value]);
      setOpen(false);
    }
    setSearch("");
  };

  const removeChip = (value: ValueType) => {
    onChange(selectedValues.filter((v) => v !== value));
  };

  const displayItems = apiSearch
    ? items
    : items.filter((item) => {
        const keys = Array.from(new Set([labelKey, ...(searchKeys ?? [])]));
        return keys.some((key) =>
          String(item[key] ?? "")
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      });

  return (
    <div ref={ref} style={{ width: 320, position: "relative" }}>
      <div
        onClick={() => setOpen(true)}
        style={{
          minHeight: 44,
          border: "2px solid #2563eb",
          borderRadius: 6,
          padding: "6px 36px 6px 6px",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          position: "relative",
          cursor: "text",
        }}
      >
        {multiple &&
          selectedValues.map((val) => {
            const item = items.find((i) => i[valueKey] === val);
            return (
              <span
                key={String(val)}
                style={{
                  background: "#e5e7eb",
                  padding: "4px 8px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                {String(item?.[labelKey])}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(val);
                  }}
                >
                  ✖
                </span>
              </span>
            );
          })}

        {!multiple && selectedValues.length === 1 && search === "" && (
          <span>
            {String(
              items.find((i) => i[valueKey] === selectedValues[0])?.[labelKey]
            )}
          </span>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={selectedValues.length ? "" : placeholder}
          style={{ border: "none", outline: "none", flex: 1 }}
          onClick={() => setOpen(true)}
        />

        {selectedValues.length > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
              setSearch("");
            }}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
            }}
          >
            ✖
          </span>
        )}
      </div>

      {open && (
        <div
          ref={dropdownRef}
          onScroll={handleScroll}
          style={{
            marginTop: 4,
            maxHeight: 220,
            overflowY: "auto",
            border: "1px solid #ddd",
          }}
        >
          {displayItems
            .filter(
              (item) => !selectedValues.includes(item[valueKey] as string)
            )
            .map((item) => (
              <div
                key={String(item[valueKey])}
                onClick={() => selectItem(item[valueKey] as string)}
                style={{ padding: 10, cursor: "pointer" }}
              >
                {String(item[labelKey])}
              </div>
            ))}

          {/* Loading */}
          {apiSearch && isLoading && (
            <div style={{ padding: 10, textAlign: "center", color: "#666" }}>
              Loading...
            </div>
          )}

          {/* No data */}
          {!isLoading && displayItems.length === 0 && (
            <div style={{ padding: 10, textAlign: "center", color: "#666" }}>
              No data found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
