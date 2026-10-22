import type { OrderStatus } from "./format";
export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
};
export type Service = {
  id: number;
  category_id: number;
  name: string;
  unit: string;
  price: number;
  est_hours: number;
  is_active: boolean;
};
export type OrderItem = {
  quantity: number;
  unit_price: number;
  services: { name: string; unit: string } | null;
};
export type Order = {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  pickup_address: string;
  pickup_time: string | null;
  delivery_time: string | null;
  status: OrderStatus;
  total: number;
  payment_method: string;
  note: string | null;
  created_at: string;
  order_items: OrderItem[];
  order_status_history: {
    id: number;
    status: OrderStatus;
    changed_at: string;
  }[];
};
