import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

// ─── Quote Form ───────────────────────────────────────────────────────────────

export const printPreferencesSchema = z.object({
  material: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.enum(["PLA", "ABS", "PETG", "Resin", "Not Sure"]).optional()
    ),
  color: z.string().max(100).optional(),
  infill: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.enum(["Standard", "High Strength", "Not Sure"]).optional()
    ),
  finish: z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.enum(["Draft/Fast", "Standard", "Fine Detail", "Not Sure"]).optional()
    ),
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
  product_id: z.string().uuid().optional(),
});

export type QuoteFormData = z.infer<typeof quoteFormSchema>;

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
    delivery_method: z.enum(["shipment", "pickup"]).default("shipment"),
    delivery_address_line: z.string().max(255).optional().nullable(),
    delivery_city: z.string().max(100).optional().nullable(),
    delivery_state: z.string().max(100).optional().nullable(),
    delivery_pincode: z.string().optional().nullable(),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1.").max(100),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_method === "shipment") {
      if (!data.delivery_address_line || data.delivery_address_line.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter your full address (at least 5 characters).",
          path: ["delivery_address_line"],
        });
      }
      if (!data.delivery_city || data.delivery_city.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City is required.",
          path: ["delivery_city"],
        });
      }
      if (!data.delivery_state || data.delivery_state.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "State is required.",
          path: ["delivery_state"],
        });
      }
      if (!data.delivery_pincode || !/^\d{6}$/.test(data.delivery_pincode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pincode must be exactly 6 digits.",
          path: ["delivery_pincode"],
        });
      }
    }
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
