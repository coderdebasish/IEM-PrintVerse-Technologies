"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils/helpers";
import type { ProductCategory } from "@/types";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const service = createServiceClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const categories = formData.getAll("categories") as ProductCategory[];
  const category = (categories[0] || formData.get("category") || "Gift") as ProductCategory;
  const is_available = formData.get("is_available") === "true";
  const is_coming_soon = formData.get("is_coming_soon") === "true";
  const display_order = parseInt(formData.get("display_order") as string) || 0;
  const imageFiles = formData.getAll("images") as File[];

  if (!name?.trim() || categories.length === 0 || isNaN(price) || price <= 0) {
    return { success: false, error: "Name, at least one category, and a valid price are required." };
  }

  const image_urls: string[] = [];
  for (const file of imageFiles) {
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() ?? "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { data, error } = await service.storage
        .from("product-images")
        .upload(fileName, buffer, { contentType: file.type });
      if (error) return { success: false, error: "Image upload failed: " + error.message };
      const { data: urlData } = service.storage.from("product-images").getPublicUrl(data.path);
      image_urls.push(urlData.publicUrl);
    }
  }

  const { data: newProd, error } = await service.from("products").insert({
    name: name.trim(),
    slug: slugify(name),
    description: description?.trim() || null,
    price,
    category,
    categories,
    image_url: image_urls[0] || null,
    image_urls,
    is_available,
    is_coming_soon,
    display_order,
  }).select().single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, product: newProd };
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const service = createServiceClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const categories = formData.getAll("categories") as ProductCategory[];
  const category = (categories[0] || formData.get("category") || "Gift") as ProductCategory;
  const is_available = formData.get("is_available") === "true";
  const is_coming_soon = formData.get("is_coming_soon") === "true";
  const display_order = parseInt(formData.get("display_order") as string) || 0;
  const existingUrls = formData.getAll("existing_image_urls") as string[];
  const newImageFiles = formData.getAll("new_images") as File[];

  if (!name?.trim() || categories.length === 0 || isNaN(price) || price <= 0) {
    return { success: false, error: "Name, at least one category, and a valid price are required." };
  }

  const image_urls = [...existingUrls];
  for (const file of newImageFiles) {
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() ?? "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const { data, error } = await service.storage
        .from("product-images")
        .upload(fileName, buffer, { contentType: file.type });
      if (error) return { success: false, error: "Image upload failed: " + error.message };
      const { data: urlData } = service.storage.from("product-images").getPublicUrl(data.path);
      image_urls.push(urlData.publicUrl);
    }
  }

  const updates: Record<string, unknown> = {
    name: name.trim(),
    description: description?.trim() || null,
    price,
    category,
    categories,
    image_url: image_urls[0] || null,
    image_urls,
    is_available,
    is_coming_soon,
    display_order,
  };

  const { data: updatedProd, error } = await service.from("products").update(updates).eq("id", id).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, product: updatedProd };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const service = createServiceClient();

  // 1. Unlink any orders referencing this product to avoid foreign key constraint error
  await service.from("orders").update({ product_id: null }).eq("product_id", id);

  // 2. Delete product
  const { error } = await service.from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

export async function toggleProductAvailability(id: string, is_available: boolean) {
  await requireAdmin();
  const service = createServiceClient();
  const { error } = await service.from("products").update({ is_available }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}
