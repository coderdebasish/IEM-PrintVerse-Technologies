export type OrderStatus =
  | "Requested"
  | "Contacted"
  | "Quoted"
  | "Payment Pending"
  | "Payment Received"
  | "Paid"
  | "Confirmed"
  | "Printing"
  | "Invoice Sent"
  | "Shipped"
  | "Completed"
  | "Cancelled";

export type OrderType = "quote" | "purchase";

export type ProductCategory =
  | "Heritage"
  | "Gift"
  | "Home"
  | "Kids"
  | "Office"
  | "Engineering";

export interface PrintPreferences {
  material?: "PLA" | "ABS" | "PETG" | "Resin" | "Not Sure";
  color?: string;
  infill?: "Standard" | "High Strength" | "Not Sure";
  finish?: "Draft/Fast" | "Standard" | "Fine Detail" | "Not Sure";
  quantity?: number;
}

export interface Order {
  id: string;
  tracking_id: string;
  order_type: OrderType;
  customer_name: string;
  email: string;
  phone: string;
  // Quote-flow
  stl_file_url: string | null;
  message: string | null;
  print_preferences: PrintPreferences | null;
  quoted_price: number | null;
  // Purchase-flow
  product_id: string | null;
  quantity: number;
  delivery_address_line: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_pincode: string | null;
  delivery_charge: number;
  subtotal: number | null;
  total_amount: number | null;
  // Shared payment
  payment_link: string | null;
  paid_at: string | null;
  // Status
  status: OrderStatus;
  // Confirmation & invoice
  confirmed_via_call: boolean;
  confirmed_at: string | null;
  invoice_released: boolean;
  invoice_url: string | null;
  invoice_released_at: string | null;
  // Cancellation
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  image_url: string | null;
  is_available: boolean;
  is_coming_soon: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
}
