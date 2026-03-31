import { createClient } from "@/lib/supabase/server";
import { TrendsClient } from "@/components/student/TrendsClient";

// Cache this page for 30 seconds
export const revalidate = 30;

export default async function TrendsPage() {
  const supabase = await createClient();

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  // Fetch max price for slider range
  const { data: priceData } = await supabase
    .from("items")
    .select("price")
    .eq("is_available", true)
    .is("deleted_at", null)
    .order("price", { ascending: false })
    .limit(1)
    .single();

  const maxPrice = (priceData?.price as number) ?? 500;

  return (
    <TrendsClient
      categories={(categories ?? []) as { id: string; name: string }[]}
      maxPrice={maxPrice}
    />
  );
}
