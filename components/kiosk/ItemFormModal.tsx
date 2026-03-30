"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { KioskItem } from "./KioskItemsClient";

interface ItemFormModalProps {
  kioskId: string;
  categories: { id: string; name: string }[];
  editItem: KioskItem | null;
  onClose: () => void;
  onSaved: (item: KioskItem, isEdit: boolean) => void;
}

export function ItemFormModal({
  kioskId,
  categories,
  editItem,
  onClose,
  onSaved,
}: ItemFormModalProps) {
  const isEdit = !!editItem;
  const supabase = createClient();

  const [name, setName] = useState(editItem?.name ?? "");
  const [price, setPrice] = useState(editItem?.price?.toString() ?? "");
  const [isVeg, setIsVeg] = useState(editItem?.is_veg ?? true);
  const [categoryId, setCategoryId] = useState(editItem?.category_id ?? "");
  const [imageUrl, setImageUrl] = useState(editItem?.image_url ?? "");
  const [isAvailable, setIsAvailable] = useState(
    editItem?.is_available ?? true
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !price.trim()) {
      setError("Name and price are required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      price: parseFloat(price),
      is_veg: isVeg,
      category_id: categoryId || null,
      image_url: imageUrl.trim() || null,
      is_available: isAvailable,
      kiosk_id: kioskId,
    };

    if (isEdit && editItem) {
      const { error: updateError } = await supabase
        .from("items")
        .update(payload)
        .eq("id", editItem.id);

      if (updateError) {
        setError("Failed to update item.");
        setSubmitting(false);
        return;
      }

      const catName =
        categories.find((c) => c.id === categoryId)?.name ?? null;
      onSaved(
        { ...editItem, ...payload, category_name: catName },
        true
      );
    } else {
      const { data, error: insertError } = await supabase
        .from("items")
        .insert(payload)
        .select("id")
        .single();

      if (insertError || !data) {
        setError("Failed to add item.");
        setSubmitting(false);
        return;
      }

      const catName =
        categories.find((c) => c.id === categoryId)?.name ?? null;
      onSaved(
        {
          id: data.id,
          ...payload,
          category_name: catName,
        },
        false
      );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-lg bg-surface rounded-t-[2rem] z-10 flex flex-col max-h-[90vh] overflow-hidden"
          style={{
            boxShadow: "0 0 40px rgba(59, 130, 246, 0.1)",
          }}
          initial={{ y: 400 }}
          animate={{ y: 0 }}
          exit={{ y: 400 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full" />
          </div>

          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-surface-container to-surface rounded-t-2xl">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-bright/40 transition-all"
            >
              <X size={20} className="text-on-surface" />
            </button>
            <h1 className="font-bold text-lg text-on-surface">
              {isEdit ? "Edit Item" : "Add New Item"}
            </h1>
            <div className="w-10" />
          </header>

          {/* Form */}
          <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-32">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface/60 tracking-wide uppercase ml-1">
                Item Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chole Bhature"
                className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-on-surface/30 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface/60 tracking-wide uppercase ml-1">
                Price (₹)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 120"
                className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-on-surface/30 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>

            {/* Veg / Non-Veg */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-on-surface/60 tracking-wide uppercase ml-1">
                Dietary Preference
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-surface-container-high rounded-2xl">
                <button
                  onClick={() => setIsVeg(true)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
                    isVeg
                      ? "bg-green-900/30 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/5"
                      : "text-on-surface/40 hover:bg-surface-bright/20"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Veg
                </button>
                <button
                  onClick={() => setIsVeg(false)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
                    !isVeg
                      ? "bg-red-900/30 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/5"
                      : "text-on-surface/40 hover:bg-surface-bright/20"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Non-Veg
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface/60 tracking-wide uppercase ml-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image URL + Preview */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface/60 tracking-wide uppercase ml-1">
                Item Visuals
              </label>
              <div className="flex gap-4 items-start">
                <textarea
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste Image URL here..."
                  rows={3}
                  className="flex-1 bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface placeholder:text-on-surface/30 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all resize-none"
                />
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center bg-surface-container-lowest shrink-0 overflow-hidden">
                  {imageUrl.trim() ? (
                    <Image
                      src={imageUrl.trim()}
                      alt="Preview"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      onError={() => {}}
                    />
                  ) : (
                    <>
                      <span className="text-on-surface/30 text-3xl mb-1">
                        🖼️
                      </span>
                      <span className="text-[10px] text-on-surface/30 font-bold uppercase tracking-tighter">
                        Preview
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Info hint */}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
              <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface/60 leading-relaxed italic">
                High-quality images with warm lighting tend to increase kiosk
                conversion rates. Use 1:1 aspect ratio for best results.
              </p>
            </div>

            {/* Available Toggle */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Available Now</span>
              <button
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isAvailable
                    ? "bg-green-500"
                    : "bg-surface-container-highest"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-transform ${
                    isAvailable
                      ? "translate-x-[22px]"
                      : "translate-x-[2px]"
                  }`}
                />
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium text-center">
                {error}
              </p>
            )}
          </main>

          {/* Footer */}
          <footer className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface via-surface to-transparent pt-12">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-5 bg-blue-500 hover:bg-blue-400 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEdit
                ? "Update Item"
                : "Add Item"}
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
