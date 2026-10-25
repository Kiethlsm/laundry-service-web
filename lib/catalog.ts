import "server-only";
import { cache } from "react";
import { isConfigured, serviceClient } from "./supabase-server";
import type { Category, Service } from "./types";

const names = [
  ["Giặt sấy", "giat-say", "Quần áo sạch thơm, sấy khô và gấp gọn."],
  ["Giặt giày", "giat-giay", "Chăm chút từng đôi, sạch từ trong ra ngoài."],
  ["Giặt mền chăn", "giat-men", "Mền, chăn, drap và gối cho giấc ngủ dễ chịu."],
  ["Ủi đồ", "ui-do", "Phẳng phiu từ áo hằng ngày đến bộ vest."],
  ["Sửa đồ", "sua-do", "Lên lai, thay khóa, vá may để đồ lại vừa vặn."],
  [
    "Giặt gấu bông",
    "giat-gau-bong",
    "Làm sạch người bạn nhỏ một cách cẩn thận.",
  ],
];
export const sampleCategories: Category[] = names.map(
  ([name, slug, description], i) => ({
    id: i + 1,
    name,
    slug,
    description,
    sort_order: i + 1,
  }),
);
const rows: [number, string, string, number, number][] = [
  [1, "Giặt sấy thường", "kg", 25000, 24],
  [1, "Giặt sấy lấy nhanh", "kg", 35000, 8],
  [2, "Giặt giày sneaker/vải", "doi", 80000, 48],
  [2, "Giặt giày da", "doi", 120000, 72],
  [3, "Giặt mền/chăn đơn", "cai", 90000, 48],
  [3, "Giặt mền/chăn đôi", "cai", 130000, 48],
  [3, "Giặt bộ drap + gối", "bo", 70000, 48],
  [4, "Ủi quần áo thường", "cai", 10000, 24],
  [4, "Ủi vest / áo dài", "cai", 40000, 24],
  [5, "Lên lai quần/váy", "cai", 30000, 72],
  [5, "Thay khóa kéo", "cai", 50000, 72],
  [5, "Vá / may đồ", "cai", 40000, 72],
  [6, "Gấu bông nhỏ (< 30cm)", "cai", 50000, 72],
  [6, "Gấu bông vừa (30-60cm)", "cai", 90000, 72],
  [6, "Gấu bông lớn (> 60cm)", "cai", 150000, 96],
];
export const sampleServices: Service[] = rows.map(
  ([category_id, name, unit, price, est_hours], i) => ({
    id: i + 1,
    category_id,
    name,
    unit,
    price,
    est_hours,
    is_active: true,
  }),
);
export const getCatalog = cache(async () => {
  if (!isConfigured())
    return {
      categories: sampleCategories,
      services: sampleServices,
      demo: true,
    };
  // Only the public service catalog is shared between requests. Order, auth
  // and payment clients retain their default uncached behavior.
  const db = serviceClient((input, init) => fetch(input, {
    ...init,
    next: { revalidate: 60 },
  }));
  const [categories, services] = await Promise.all([
    db.from("service_categories").select("*").order("sort_order"),
    db.from("services").select("*").eq("is_active", true).order("id"),
  ]);
  if (categories.error || services.error)
    throw new Error("Không tải được bảng giá. Vui lòng thử lại sau.");
  return {
    categories: categories.data as Category[],
    services: services.data as Service[],
    demo: false,
  };
});
