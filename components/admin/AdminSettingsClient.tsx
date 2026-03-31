"use client";

import { useState } from "react";
import {
  Settings2,
  Zap,
  CheckCircle2,
  Activity,
  Tags,
  X,
  Plus,
  Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: string;
  name: string;
}

interface AdminSettingsClientProps {
  initialDailyLimit: number;
  initialBroadcastMessage: string;
  initialCategories: Category[];
}

export function AdminSettingsClient({
  initialDailyLimit,
  initialBroadcastMessage,
  initialCategories,
}: AdminSettingsClientProps) {
  const [dailyLimit, setDailyLimit] = useState(initialDailyLimit);
  const [savingLimit, setSavingLimit] = useState(false);
  
  const [broadcastMessage, setBroadcastMessage] = useState(initialBroadcastMessage);
  const [savingBroadcast, setSavingBroadcast] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const supabase = createClient();

  const handleSaveLimit = async () => {
    setSavingLimit(true);
    await supabase
      .from("config")
      .upsert({ key: "daily_swipe_limit", value: { limit: dailyLimit } });
    setSavingLimit(false);
  };

  const handleSaveBroadcast = async () => {
    setSavingBroadcast(true);
    await supabase
      .from("config")
      .upsert({ key: "broadcast_message", value: { message: broadcastMessage.trim() } });
    setSavingBroadcast(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setAddingCategory(true);
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: newCategory.trim() })
      .select("id, name")
      .single();

    if (!error && data) {
      setCategories((prev) => [...prev, data]);
      setNewCategory("");
    }
    setAddingCategory(false);
  };

  const handleDeleteCategory = async (id: string) => {
    setDeletingCatId(id);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    setDeletingCatId(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <header className="mb-12">
        <h2 className="text-4xl font-extrabold tracking-tighter text-on-surface mb-2">
          System Settings
        </h2>
        <p className="text-on-surface/40 max-w-2xl text-sm">
          Manage global application parameters, culinary taxonomies, and
          platform-wide thresholds.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* App Configuration Section */}
        <section className="col-span-1 lg:col-span-7 space-y-8">
          <div
            className="bg-surface-container rounded-3xl p-8 transition-all"
            style={{
              boxShadow: "0 0 20px rgba(255, 140, 0, 0.08)",
              border: "1px solid rgba(86, 67, 52, 0.15)",
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                  <Settings2 className="text-primary-container" size={24} />
                  App Configuration
                </h3>
                <p className="text-sm text-on-surface/40">
                  Core operational thresholds and limits
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Daily Swipe Limit Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl bg-surface-container-highest/30 hover:bg-surface-container-highest/50 transition-colors gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-on-surface">
                      Daily Swipe Limit
                    </h4>
                    <p className="text-xs text-on-surface/40">
                      Global cap for swipe interactions per student in 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <div className="flex items-center bg-surface-container-highest rounded-full p-1">
                    <button
                      onClick={() => setDailyLimit((prev) => Math.max(0, prev - 5))}
                      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-surface-bright text-on-surface/40 transition-all font-bold"
                    >
                      −
                    </button>
                    <span className="px-5 font-bold text-lg text-primary-container min-w-[3rem] text-center">
                      {dailyLimit}
                    </span>
                    <button
                      onClick={() => setDailyLimit((prev) => prev + 5)}
                      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-surface-bright text-on-surface/40 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={handleSaveLimit}
                    disabled={savingLimit || dailyLimit === initialDailyLimit}
                    className="px-6 py-2 bg-primary-container text-surface-dim font-bold rounded-full text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingLimit ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {/* Global Broadcast Message Row */}
              <div className="flex flex-col p-6 rounded-2xl bg-surface-container-highest/30 hover:bg-surface-container-highest/50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-on-surface">
                      Global Announcement Banner
                    </h4>
                    <p className="text-xs text-on-surface/40">
                      Displays a dismissible banner at the top of the student app. Leave blank to disable.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="e.g. App maintenance scheduled for midnight..."
                    className="flex-1 bg-surface-container-highest/50 border-none rounded-2xl py-3 px-4 text-sm text-on-surface placeholder:text-on-surface/30 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  />
                  <button
                    onClick={handleSaveBroadcast}
                    disabled={savingBroadcast || broadcastMessage === initialBroadcastMessage}
                    className="px-6 py-3 sm:py-2 bg-blue-500 text-white font-bold rounded-2xl sm:rounded-full text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {savingBroadcast ? "Saving..." : "Update Banner"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-primary-container/5 p-8 rounded-3xl border border-primary-container/10">
              <CheckCircle2
                className="text-primary-container mb-4 block"
                size={32}
              />
              <h4 className="font-bold text-lg mb-2 text-on-surface">
                Auto-Sync Enabled
              </h4>
              <p className="text-sm text-on-surface/60 leading-relaxed">
                System parameters are synchronized across all connected kiosk
                terminals automatically.
              </p>
            </div>
            <div className="bg-cyan-500/5 p-8 rounded-3xl border border-cyan-500/10">
              <Activity className="text-cyan-500 mb-4 block" size={32} />
              <h4 className="font-bold text-lg mb-2 text-on-surface">
                Platform Status
              </h4>
              <p className="text-sm text-on-surface/60 leading-relaxed">
                All PWA services and realtime database subscriptions are currently
                operational.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Manager Section */}
        <section className="col-span-1 lg:col-span-5 h-[calc(100%-1rem)]">
          <div
            className="bg-surface-container rounded-3xl p-8 flex flex-col h-full"
            style={{
              boxShadow: "0 0 20px rgba(255, 140, 0, 0.04)",
              border: "1px solid rgba(86, 67, 52, 0.15)",
            }}
          >
            <div className="mb-8 flex-shrink-0">
              <h3 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                <Tags className="text-primary-container" size={24} />
                Cuisine Categories
              </h3>
              <p className="text-sm text-on-surface/40">
                Manage tags used globally for food classification
              </p>
            </div>

            {/* Chips Container */}
            <div className="flex flex-wrap gap-3 flex-1 content-start overflow-y-auto min-h-[200px] mb-8 pr-2 custom-scrollbar">
              {categories.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm font-medium text-on-surface/30">
                    No categories defined.
                  </span>
                </div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest border border-outline-variant/30 group hover:border-primary-container/50 transition-all"
                  >
                    <span className="text-sm font-medium text-on-surface flex-1">
                      {cat.name}
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      disabled={deletingCatId === cat.id}
                      className="text-on-surface/30 hover:text-red-400 transition-colors shrink-0 disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Input */}
            <div className="mt-auto pt-6 border-t border-outline-variant/10 flex-shrink-0">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/40 mb-3">
                Create New Category
              </label>
              <form onSubmit={handleAddCategory} className="flex gap-3">
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Italian"
                  className="flex-1 bg-surface-container-highest/50 border-none rounded-2xl py-3 px-4 text-sm text-on-surface placeholder:text-on-surface/30 focus:ring-1 focus:ring-primary-container transition-all"
                />
                <button
                  type="submit"
                  disabled={addingCategory || !newCategory.trim()}
                  className="px-6 py-3 bg-primary-container text-surface-dim font-bold rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary-container/10 flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
