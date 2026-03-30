"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Plus, Trash2, MoreVertical, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ItemFormModal } from "./ItemFormModal";

export interface KioskItem {
  id: string;
  name: string;
  price: number | null;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
  category_id: string | null;
  category_name: string | null;
}

interface KioskItemsClientProps {
  kioskId: string;
  initialItems: KioskItem[];
  categories: { id: string; name: string }[];
}

type FilterTab = "all" | "active" | "paused";

export function KioskItemsClient({
  kioskId,
  initialItems,
  categories,
}: KioskItemsClientProps) {
  const [items, setItems] = useState<KioskItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<KioskItem | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const supabase = createClient();

  const totalItems = items.length;
  const activeCount = items.filter((i) => i.is_available).length;
  const pausedCount = totalItems - activeCount;

  const filtered = items.filter((item) => {
    if (filter === "active" && !item.is_available) return false;
    if (filter === "paused" && item.is_available) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const handleToggle = async (itemId: string, current: boolean) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, is_available: !current } : i
      )
    );
    await supabase
      .from("items")
      .update({ is_available: !current })
      .eq("id", itemId);
  };

  const handleDelete = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setDeleteConfirm(null);
    await supabase
      .from("items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", itemId);
  };

  const handleItemSaved = (saved: KioskItem, isEdit: boolean) => {
    if (isEdit) {
      setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
    } else {
      setItems((prev) => [saved, ...prev]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  return (
    <>
      <div className="px-4 pb-8 max-w-2xl mx-auto">
        {/* Stats Row */}
        <div className="flex gap-3 mb-6">
          {[
            { label: "Total Items", value: totalItems, color: "text-blue-400" },
            { label: "Active", value: activeCount, color: "text-green-400" },
            { label: "Paused", value: pausedCount, color: "text-on-surface/50" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 glass-card-blue rounded-xl p-3 text-center"
            >
              <div className={`text-xl font-extrabold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[10px] text-on-surface/40 uppercase tracking-wider font-bold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter + Add */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30"
            />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl py-3 pl-9 pr-4 text-sm text-on-surface placeholder:text-on-surface/30 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => {
              setEditItem(null);
              setShowForm(true);
            }}
            className="bg-blue-500 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-1 active:scale-95 transition-transform whitespace-nowrap"
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-6">
          {(["all", "active", "paused"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
                filter === tab
                  ? "bg-blue-500 text-white"
                  : "bg-surface-container-highest text-on-surface/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`glass-card-blue rounded-xl p-4 flex items-center gap-4 relative transition-opacity ${
                !item.is_available ? "opacity-70" : ""
              }`}
            >
              {/* Image */}
              <div
                className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 ${
                  !item.is_available ? "grayscale" : ""
                }`}
              >
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500/30 to-blue-400/10 flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.is_veg
                        ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                        : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    }`}
                  />
                  <h3 className="font-bold text-lg truncate text-on-surface">
                    {item.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {item.price !== null && (
                    <span className="bg-surface-bright/30 px-3 py-0.5 rounded-full text-sm font-bold text-primary italic">
                      ₹{item.price}
                    </span>
                  )}
                  {item.category_name && (
                    <span className="bg-surface-container-highest/50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider text-on-surface/40 font-semibold">
                      {item.category_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle + Menu */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(item.id, item.is_available)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    item.is_available
                      ? "bg-green-500"
                      : "bg-surface-container-highest"
                  }`}
                >
                  <div
                    className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-transform ${
                      item.is_available
                        ? "translate-x-[22px]"
                        : "translate-x-[2px]"
                    }`}
                  />
                </button>

                <div className="relative">
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === item.id ? null : item.id)
                    }
                    className="text-on-surface/30 hover:text-on-surface p-1"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {menuOpen === item.id && (
                    <div className="absolute top-8 right-0 z-20 bg-surface-container rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                      <button
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-highest"
                        onClick={() => {
                          setEditItem(item);
                          setShowForm(true);
                          setMenuOpen(null);
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-surface-container-highest"
                        onClick={() => {
                          setDeleteConfirm(item.id);
                          setMenuOpen(null);
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete confirmation */}
              {deleteConfirm === item.id && (
                <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm rounded-xl flex items-center justify-center gap-4 z-10">
                  <p className="text-sm font-bold text-on-surface">
                    Delete this item?
                  </p>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-on-surface/40">
              <p className="text-4xl mb-4">📦</p>
              <p className="font-bold">No items found</p>
              <p className="text-sm">
                {search ? "Try a different search" : "Add your first item!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Item Form Modal */}
      {showForm && (
        <ItemFormModal
          kioskId={kioskId}
          categories={categories}
          editItem={editItem}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
          }}
          onSaved={handleItemSaved}
        />
      )}
    </>
  );
}
