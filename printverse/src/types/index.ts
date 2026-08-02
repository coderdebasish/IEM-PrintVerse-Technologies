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
  cancellation_requested?: boolean;
  cancellation_requested_reason?: string | null;
  // Feedback
  feedback_token: string | null;
  feedback_requested_at: string | null;
  has_submitted_feedback?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  order_id: string;
  tracking_id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  message: string;
  is_approved: boolean;
  is_published: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  categories: ProductCategory[];
  image_url: string | null;
  image_urls: string[];
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

// ─── Quotation & Invoice System ───────────────────────────────────────────────

export interface QuotationItem {
  description: string;
  qty: number;
  rate: number;
  amount: number; // qty * rate, auto-calculated
}

export type DiscountType = "none" | "percentage" | "fixed";
export type DocType = "quotation" | "invoice";

export interface Quotation {
  id: string;
  order_id: string;
  tracking_id: string;
  // Editable customer info
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string | null;
  // Document metadata
  quotation_number: string;       // QT-XXXXXX
  issue_date: string;             // ISO date string
  valid_until: string | null;     // ISO date string
  // Line items
  items: QuotationItem[];
  // Financials
  subtotal: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  total: number;
  // Notes / terms
  notes: string | null;
  // Storage paths in "invoices" bucket
  quotation_pdf_path: string | null;  // quotations/QT-XXXXXX.pdf
  invoice_pdf_path: string | null;    // invoices/INV-XXXXXX.pdf
  // Stage
  doc_type: DocType; // "quotation" = editable, "invoice" = locked
  created_at: string;
  updated_at: string;
}
