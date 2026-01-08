import React, { useEffect, useRef, useState } from "react";

type ValueType = string | number;

interface DropdownProps<T extends Record<string, any>> {
  options?: T[];
  apiUrl?: string;
  apiSearch?: boolean;
  labelKey: keyof T;
  valueKey: keyof T;
  searchKeys?: (keyof T)[];
  placeholder?: string;
  multiple?: boolean;
  selectedValues: ValueType[];
  onChange: (values: ValueType[]) => void;
  pageSize?: number;
}

const authToken =
  "eyJhbGciOiJIUzI1NiIsImtleV9hY2Nlc3MiOiJzdWJzY3JpcHRpb25fYWNjZXNzIiwidHlwIjoiSldUIn0.eyJ1c2VybmFtZSI6InNtaXQudkB5b3BtYWlsLmNvbSIsImV4cCI6MTc2ODQ3NzA2NCwiaWF0IjoxNzY3NjEzMDY0LjU2NjMyLCJpZCI6IjdmNDM4NzY1LTNjN2ItNDhmZC04MzA3LWU0Y2EyYWIwYWU3NSIsImVtYWlsIjoic21pdC52QHlvcG1haWwuY29tIiwic3Vic2NyaXB0aW9uX2lkIjoiY2I3YjZhMzAtMzRiNC00MjVlLWI4ZTgtMWQwNDViY2Y2MjUyIn0.yaTMyh9T6N4xgzNDLEG9TSrP78PPu7Pyrt0bCX25fvY";

function Dropdown<T extends Record<string, any>>({
  options = [],
  apiUrl,
  apiSearch = false,
  labelKey,
  valueKey,
  searchKeys,
  placeholder = "Select...",
  multiple = false,
  selectedValues,
  pageSize = 100,
  onChange,
}: DropdownProps<T>) {
  const isStatic = options.length > 0 && !apiUrl;

  const [items, setItems] = useState<T[]>(options);
  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const PAGE_SIZE = pageSize;

  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStatic) setItems(options);
  }, [isStatic, options]);

  useEffect(() => {
    if (!apiSearch) return;
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search, apiSearch]);

  useEffect(() => {
    if (!apiSearch) return;
    setItems([]);
    setPage(1);
    setHasNext(true);
  }, [debouncedSearch, apiSearch]);

  useEffect(() => {
    if (!apiSearch || !apiUrl || !hasNext || isLoading) return;

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
        let list: T[] = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.data)) list = data.data;
        else if (Array.isArray(data?.results)) list = data.results;

        setItems((prev) => (page === 1 ? list : [...prev, ...list]));
        setHasNext(list.length === PAGE_SIZE);
      })
      .catch(() => setHasNext(false))
      .finally(() => setIsLoading(false));
  }, [apiUrl, page, debouncedSearch, apiSearch]);

  /* ---------- INTERSECTION OBSERVER ---------- */
  useEffect(() => {
    if (!apiSearch || !open || !hasNext || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          observer.unobserve(entry.target);
          setPage((p) => p + 1);
        }
      },
      { root: dropdownRef.current, threshold: 0.1 }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [open, hasNext, isLoading, apiSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectItem = (value: ValueType) => {
    if (multiple) onChange([...selectedValues, value]);
    else {
      onChange([value]);
      setOpen(false);
    }
    setSearch("");
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
  const removeChip = (value: ValueType) => {
    onChange(selectedValues.filter((v) => v !== value));
  };
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
                {item?.[labelKey]}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(val);
                  }}
                >
                  {""} ✖
                </span>
              </span>
            );
          })}

        {!multiple && selectedValues.length === 1 && search === "" && (
          <span>
            {items.find((i) => i[valueKey] === selectedValues[0])?.[labelKey]}
          </span>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={selectedValues.length ? "" : placeholder}
          style={{ border: "none", outline: "none", flex: 1 }}
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
          style={{
            marginTop: 4,
            maxHeight: 220,
            overflowY: "auto",
            border: "1px solid #ddd",
          }}
        >
          {displayItems
            .filter((item) => {
              const value = item[valueKey] as ValueType;
              return !selectedValues.includes(value);
            })
            .map((item) => {
              const value = item[valueKey] as ValueType;
              return (
                <div
                  key={String(value)}
                  onClick={() => selectItem(value)}
                  style={{ padding: 10, cursor: "pointer" }}
                >
                  {String(item[labelKey])}
                </div>
              );
            })}

          {apiSearch && <div ref={loadMoreRef} style={{ height: 1 }} />}

          {/* LOADING */}
          {apiSearch && isLoading && (
            <div style={{ padding: 10, textAlign: "center", color: "#666" }}>
              Loading...
            </div>
          )}

          {/* NO DATA */}
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
