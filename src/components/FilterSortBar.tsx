import { useState, useMemo, type ReactNode } from "react";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  multi?: boolean;
}

export interface SortOption {
  value: string;
  label: string;
}

export type FilterState = Record<string, string | string[]>;

interface FilterSortBarProps {
  filterGroups: FilterGroup[];
  sortOptions: SortOption[];
  filters: FilterState;
  sort: string;
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sort: string) => void;
  resultCount?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

const FilterSortBar = ({
  filterGroups,
  sortOptions,
  filters,
  sort,
  onFilterChange,
  onSortChange,
  resultCount,
}: FilterSortBarProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    for (const group of filterGroups) {
      const val = filters[group.key];
      if (Array.isArray(val) && val.length > 0) count++;
      else if (typeof val === "string" && val !== "all" && val !== "") count++;
    }
    return count;
  }, [filters, filterGroups]);

  const handleSingleFilter = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    const cleared: FilterState = {};
    for (const group of filterGroups) {
      cleared[group.key] = group.multi ? [] : "all";
    }
    onFilterChange(cleared);
    onSortChange("default");
  };

  const currentSortLabel =
    sortOptions.find((s) => s.value === sort)?.label || "Relevance";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filter button — opens Sheet on mobile, always visible */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs bg-primary text-primary-foreground"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {filterGroups.map((group) => (
              <div key={group.key}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {group.label}
                </h4>
                <div className="space-y-1">
                  {group.options.map((opt) => {
                    const isActive = filters[group.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          handleSingleFilter(group.key, opt.value);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        {opt.icon && <span className="w-4 h-4">{opt.icon}</span>}
                        <span className="flex-1">{opt.label}</span>
                        {isActive && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {sortOptions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Sort By
                </h4>
                <div className="space-y-1">
                  {sortOptions.map((opt) => {
                    const isActive = sort === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onSortChange(opt.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <span className="flex-1">{opt.label}</span>
                        {isActive && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="w-full"
              >
                Clear All
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sort pill dropdown — desktop */}
      {sortOptions.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:inline-flex">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{currentSortLabel}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSortChange(opt.value)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                  sort === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <span className="flex-1">{opt.label}</span>
                {sort === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      {/* Quick-filter pills — desktop only, first option from each group */}
      {filterGroups.map((group) => {
        const currentValue = filters[group.key];
        const activeOption = group.options.find(
          (o) => o.value === currentValue && o.value !== "all"
        );
        return (
          <Popover key={group.key}>
            <PopoverTrigger asChild>
              <Button
                variant={activeOption ? "default" : "outline"}
                size="sm"
                className="gap-1.5 hidden sm:inline-flex"
              >
                <span>{activeOption ? activeOption.label : group.label}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              {group.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSingleFilter(group.key, opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    currentValue === opt.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  {opt.icon && <span className="w-4 h-4">{opt.icon}</span>}
                  <span className="flex-1">{opt.label}</span>
                  {currentValue === opt.value && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        );
      })}

      {/* Clear all — shown when filters are active */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear</span>
        </Button>
      )}

      {/* Result count — right side */}
      {resultCount !== undefined && (
        <span className="ml-auto text-sm text-muted-foreground">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
};

export default FilterSortBar;
