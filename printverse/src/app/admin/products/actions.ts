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
  const category = formData.get("category") as ProductCategory;
  const is_available = formData.get("is_available") === "true";
  const is_coming_soon = formData.get("is_coming_soon") === "true";
  const display_order = parseInt(formData.get("display_order") as string) || 0;
  const imageFile = formData.get("image") as File | null;

  if (!name?.trim() || !category || isNaN(price) || price <= 0) {
    return { success: false, error: "Name, category, and a valid price are required." };
  }

  let image_url: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}-${slugify(name)}.${ext}`;
    const { data, error } = await service.storage
      .from("product-images")
      .upload(fileName, buffer, { contentType: imageFile.type });
    if (error) return { success: false, error: "Image upload failed: " + error.message };
    const { data: urlData } = service.storage.from("product-images").getPublicUrl(data.path);
    image_url = urlData.publicUrl;
  }

  const { error } = await service.from("products").insert({
    name: name.trim(),
    slug: slugify(name),
    description: description?.trim() || null,
    price,
    category,
    image_url,
    is_available,
    is_coming_soon,
    display_order,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const service = createServiceClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as ProductCategory;
  const is_available = formData.get("is_available") === "true";
  const is_coming_soon = formData.get("is_coming_soon") === "true";
  const display_order = parseInt(formData.get("display_order") as string) || 0;
  const imageFile = formData.get("image") as File | null;

  const updates: Record<string, unknown> = {
    name: name.trim(),
    description: description?.trim() || null,
    price,
    category,
    is_available,
    is_coming_soon,
    display_order,
  };

  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}-${slugify(name)}.${ext}`;
    const { data, error } = await service.storage
      .from("product-images")
      .upload(fileName, buffer, { contentType: imageFile.type });
    if (error) return { success: false, error: "Image upload failed: " + error.message };
    const { data: urlData } = service.storage.from("product-images").getPublicUrl(data.path);
    updates.image_url = urlData.publicUrl;
  }

  const { error } = await service.from("products").update(updates).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const service = createServiceClient();
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
