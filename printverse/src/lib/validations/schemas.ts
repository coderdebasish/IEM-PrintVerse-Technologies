import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

// ─── Quote Form ───────────────────────────────────────────────────────────────

export const printPreferencesSchema = z.object({
  material: z
    .enum(["PLA", "ABS", "PETG", "Resin", "Not Sure"])
    .optional(),
  color: z.string().max(100).optional(),
  infill: z.enum(["Standard", "High Strength", "Not Sure"]).optional(),
  finish: z
    .enum(["Draft/Fast", "Standard", "Fine Detail", "Not Sure"])
    .optional(),
  quantity: z.coerce.number().int().min(1).max(1000).optional(),
});

export const quoteFormSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Please enter a valid email address."),
  phone: z
    .string()
    .min(1, "Phone number is required.")
    .refine(
      (val) => {
        try {
          return isValidPhoneNumber(val);
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid phone number." }
    ),
  message: z.string().max(2000).optional(),
  print_preferences: printPreferencesSchema.optional(),
});

export type QuoteFormData = z.infer<typeof quoteFormSchema>;

// ─── Buy Now / Checkout Form ──────────────────────────────────────────────────

export const checkoutFormSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Please enter a valid email address."),
  phone: z
    .string()
    .min(1, "Phone number is required.")
    .refine(
      (val) => {
        try {
          return isValidPhoneNumber(val);
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid phone number." }
    ),
  delivery_address_line: z
    .string()
    .min(5, "Please enter your full address.")
    .max(255),
  delivery_city: z.string().min(2, "City is required.").max(100),
  delivery_state: z.string().min(2, "State is required.").max(100),
  delivery_pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1.").max(100),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// ─── Admin: Set Quoted Price ──────────────────────────────────────────────────

export const quotedPriceSchema = z.object({
  quoted_price: z.coerce
    .number()
    .positive("Price must be greater than 0.")
    .multipleOf(0.01, "Price can have at most 2 decimal places."),
});

// ─── Admin: Cancellation ─────────────────────────────────────────────────────

export const cancellationSchema = z.object({
  cancellation_reason: z
    .string()
    .min(10, "Please provide a reason (at least 10 characters).")
    .max(500),
});

// ─── Admin: Settings ─────────────────────────────────────────────────────────

export const deliveryRateSchema = z.object({
  delivery_flat_rate: z.coerce
    .number()
    .min(0, "Delivery rate cannot be negative.")
    .multipleOf(0.01),
});
