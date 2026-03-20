import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterSortBar, { type FilterState } from "@/components/FilterSortBar";
import { useCampusPlaces, type CampusPlace } from "@/hooks/useCampusPlaces";
import { CampusCardSkeleton, SkeletonGrid } from "@/components/CardSkeleton";
import { shortAddress } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import {
  createCampusPlace,
  updateCampusPlace,
  deleteCampusPlace,
  type CampusPlacePayload,
} from "@/lib/adminApi";
import { canOpenCampusDetails } from "@/lib/campusData";

// ─── Constants ───────────────────────────────────────────────────────────────

const CAMPUS_FILTER_GROUPS = [
  {
    key: "type",
    label: "Type",
    options: [
      { value: "all", label: "All" },
      { value: "Food", label: "Food" },
      { value: "Shop", label: "Shop" },
      { value: "Services", label: "Services" },
      { value: "Study", label: "Study" },
    ],
  },
];

const CAMPUS_SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name A–Z" },
];

const EMPTY_FORM: CampusPlacePayload = {
  name: "",
  type: "Food",
  sub_type: "",
  address: "",
  timing: "",
  crowd_level: "low",
  distance_from_campus: "",
  phone: "",
  website: "",
  display_price_label: "",
};

// ─── Place Form Dialog ────────────────────────────────────────────────────────

interface PlaceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CampusPlacePayload) => Promise<void>;
  initial?: Partial<CampusPlacePayload>;
  title: string;
  saving: boolean;
}

function PlaceFormDialog({
  open,
  onClose,
  onSave,
  initial,
  title,
  saving,
}: PlaceFormDialogProps) {
  const [form, setForm] = useState<CampusPlacePayload>({
    ...EMPTY_FORM,
    ...initial,
  });

  useEffect(() => {
    setForm({ ...EMPTY_FORM, ...initial });
  }, [initial, open]);

  const set = (field: keyof CampusPlacePayload, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Mingos Cafe"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Type
              </label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Shop">Shop</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Study">Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Sub-type
              </label>
              <Input
                value={form.sub_type ?? ""}
                onChange={(e) => set("sub_type", e.target.value)}
                placeholder="e.g. cafe, snacks"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Address
            </label>
            <Input
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Block / Floor / Location"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Timing
              </label>
              <Input
                value={form.timing ?? ""}
                onChange={(e) => set("timing", e.target.value)}
                placeholder="e.g. 8:00 AM – 9:00 PM"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Crowd Level
              </label>
              <Select
                value={form.crowd_level ?? "low"}
                onValueChange={(v) => set("crowd_level", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Distance from campus
              </label>
              <Input
                value={form.distance_from_campus ?? ""}
                onChange={(e) => set("distance_from_campus", e.target.value)}
                placeholder="e.g. On campus"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Price label
              </label>
              <Input
                value={form.display_price_label ?? ""}
                onChange={(e) => set("display_price_label", e.target.value)}
                placeholder="e.g. ₹50–₹200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Phone
              </label>
              <Input
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Website
              </label>
              <Input
                value={form.website ?? ""}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Campus Card ─────────────────────────────────────────────────────────────

interface CampusCardProps {
  item: CampusPlace;
  index: number;
  isAdmin: boolean;
  onEdit: (item: CampusPlace) => void;
  onDelete: (item: CampusPlace) => void;
}

const CampusCard = ({
  item,
  index,
  isAdmin,
  onEdit,
  onDelete,
}: CampusCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const canOpenDetails = canOpenCampusDetails(item.name);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative group/card">
      {canOpenDetails ? (
        <Link to={`/campus/${item.id}`} className="block h-full">
          <div
            ref={cardRef}
            className={`h-full flex flex-col bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/30 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                referrerPolicy="no-referrer-when-downgrade"
                loading="lazy"
              />
              <Badge className="absolute top-3 left-3 bg-primary capitalize">
                {item.subType || item.type}
              </Badge>
              {item.rating > 0 && (
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white text-sm">{item.rating}</span>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2 min-h-[3.5rem] mb-2">
                <h3 className="line-clamp-2 font-bold text-lg text-foreground group-hover/card:text-primary transition-colors capitalize flex-1">
                  {item.name}
                </h3>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onEdit(item);
                      }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onDelete(item);
                      }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="line-clamp-1">
                    {shortAddress(item.address)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className="line-clamp-1">{item.timing}</span>
                </div>
              </div>
              <div className="mt-auto min-h-[4.5rem] rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                <p className="line-clamp-3">
                  {item.address || "Address unavailable"}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div
          ref={cardRef}
          className={`h-full flex flex-col bg-card rounded-2xl overflow-hidden shadow-lg transition-all duration-500 border border-border ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: `${index * 50}ms` }}
          aria-disabled="true"
        >
          <div className="relative h-44 overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer-when-downgrade"
              loading="lazy"
            />
            <Badge className="absolute top-3 left-3 bg-primary capitalize">
              {item.subType || item.type}
            </Badge>
            {item.rating > 0 && (
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white text-sm">{item.rating}</span>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-2 min-h-[3.5rem] mb-2">
              <h3 className="line-clamp-2 font-bold text-lg text-foreground capitalize flex-1">
                {item.name}
              </h3>
              {isAdmin && (
                <div className="flex gap-1 shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{shortAddress(item.address)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{item.timing}</span>
              </div>
            </div>
            <div className="mt-auto min-h-[4.5rem] rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
              <p className="line-clamp-3">{item.address || "Address unavailable"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  item,
  onConfirm,
  onCancel,
  deleting,
}: {
  item: CampusPlace | null;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete place?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will permanently delete{" "}
          <span className="font-medium text-foreground">{item?.name}</span>.
          This cannot be undone.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const OnCampusDetails = () => {
  const { items: places, loading, isError, error } = useCampusPlaces();
  const [filters, setFilters] = useState<FilterState>({ type: "all" });
  const [sort, setSort] = useState("default");
  const role = useUserRole();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = role === "admin" || role === "superadmin";

  // ── Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CampusPlace | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<CampusPlace | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (item: CampusPlace) => {
    setEditTarget(item);
    setFormOpen(true);
  };

  const handleSave = async (data: CampusPlacePayload) => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateCampusPlace(getToken, editTarget.id, data);
        toast.success("Place updated");
      } else {
        await createCampusPlace(getToken, data);
        toast.success("Place created");
      }
      setFormOpen(false);
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ["campus_places"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCampusPlace(getToken, deleteTarget.id);
      toast.success("Place deleted");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["campus_places"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    let result = places.filter((item) => {
      const typeVal = filters.type as string;
      if (typeVal !== "all" && item.type !== typeVal) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });
    return result;
  }, [places, filters, sort]);

  // Build initial values for edit form from CampusPlace
  const editInitial = editTarget
    ? ({
        name: editTarget.name,
        type: editTarget.type,
        sub_type: editTarget.subType,
        address: editTarget.address,
        timing: editTarget.timing,
        crowd_level:
          editTarget.crowdLevel === "Low"
            ? "low"
            : editTarget.crowdLevel === "Medium"
              ? "moderate"
              : editTarget.crowdLevel === "High"
                ? "high"
                : "low",
      } satisfies Partial<CampusPlacePayload>)
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-8">
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src="/Photo-CU.jpg"
            alt="On Campus Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/80 to-slate-900/80 dark:from-slate-800/70 dark:to-background/80" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                    On CHRIST Central Campus
                  </h1>
                  <p className="text-white/90 mt-2">
                    Find on-campus shops, cafes, and services
                  </p>
                </div>
                {isAdmin && (
                  <Button
                    onClick={handleAdd}
                    className="gap-2 bg-primary/90 hover:bg-primary text-primary-foreground shadow"
                  >
                    <Plus className="w-4 h-4" />
                    Add Place
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {isAdmin && (
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Admin mode — hover a card to edit or delete it.
            </div>
          )}

          <div className="mb-6">
            <FilterSortBar
              filterGroups={CAMPUS_FILTER_GROUPS}
              sortOptions={CAMPUS_SORT_OPTIONS}
              filters={filters}
              sort={sort}
              onFilterChange={setFilters}
              onSortChange={setSort}
              resultCount={filteredItems.length}
            />
          </div>

          {loading ? (
            <SkeletonGrid
              count={6}
              gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <CampusCardSkeleton />
            </SkeletonGrid>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <CampusCard
                  key={item.id}
                  item={item}
                  index={index}
                  isAdmin={isAdmin}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}

          {!loading && isError && (
            <div className="text-center py-12 text-destructive">
              Failed to load on-campus places. Please check the API/server connection.
              {error instanceof Error && (
                <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
              )}
            </div>
          )}

          {!loading && !isError && filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No on-campus places found matching your filters.
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Create / Edit dialog */}
      <PlaceFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        initial={editInitial}
        title={editTarget ? `Edit — ${editTarget.name}` : "Add campus place"}
        saving={saving}
      />

      {/* Delete confirm dialog */}
      <DeleteConfirmDialog
        item={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </div>
  );
};

export default OnCampusDetails;
