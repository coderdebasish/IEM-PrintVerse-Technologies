"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Package, X, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/FormFields";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/helpers";
import {
  createProduct, updateProduct, deleteProduct, toggleProductAvailability,
} from "./actions";
import type { Product, ProductCategory } from "@/types";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "Heritage", label: "Heritage & Cultural" },
  { value: "Gift",     label: "Personalized Gifts" },
  { value: "Home",     label: "Home Décor" },
  { value: "Kids",     label: "Kids & Education" },
  { value: "Office",   label: "Office & Desk" },
  { value: "Engineering", label: "Engineering" },
];

/* ── Product Form ──────────────────────────────────────────────────────────── */

function ProductForm({
  existing,
  onDone,
  onCancel,
}: {
  existing?: Product;
  onDone: (product: Product) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedCats, setSelectedCats] = useState<ProductCategory[]>(
    existing?.categories ?? (existing?.category ? [existing.category] : [])
  );
  
  // Existing uploaded images list
  const [existingImages, setExistingImages] = useState<string[]>(
    existing?.image_urls ?? (existing?.image_url ? [existing.image_url] : [])
  );
  
  // Newly selected files for upload
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([]);
  
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`Image "${f.name}" too large — max 10 MB.`);
        return false;
      }
      return true;
    });

    const newItems = validFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f)
    }));

    setNewFiles(prev => [...prev, ...newItems]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleCategory = (cat: ProductCategory) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rawForm = e.currentTarget;
    const formData = new FormData(rawForm);

    if (selectedCats.length === 0) {
      toast.error("Please select at least one category.");
      return;
    }

    // Compile categories array
    formData.delete("categories");
    selectedCats.forEach(cat => {
      formData.append("categories", cat);
    });

    // Compile existing images array
    formData.delete("existing_image_urls");
    existingImages.forEach(url => {
      formData.append("existing_image_urls", url);
    });

    // Compile newly uploaded files
    formData.delete("new_images");
    formData.delete("images");
    newFiles.forEach(item => {
      formData.append("new_images", item.file); // for updateProduct
      formData.append("images", item.file);     // for createProduct
    });

    setLoading(true);

    try {
      const res = existing
        ? await updateProduct(existing.id, formData)
        : await createProduct(formData);

      if (res.success) {
        toast.success(existing ? "Product updated." : "Product created.");
        onDone({
          ...existing,
          name: formData.get("name") as string,
          price: parseFloat(formData.get("price") as string),
          description: formData.get("description") as string,
          categories: selectedCats,
          category: selectedCats[0] || "Gift",
          image_urls: [...existingImages, ...newFiles.map(() => "")], // placeholder for UI
          image_url: existingImages[0] || null,
        } as unknown as Product);
      } else {
        toast.error(res.error ?? "Failed.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6"
      style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-black text-[#0B1F4D] text-lg">
          {existing ? "Edit Product" : "New Product"}
        </h2>
        <button type="button" onClick={onCancel} className="p-2 rounded-lg hover:bg-[#f8f9fb] text-slate-400 hover:text-[#C41E2C]">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label="Product Name" name="name" required defaultValue={existing?.name}
            placeholder="e.g. Howrah Bridge Mini" />
          <Input label="Price (₹)" name="price" type="number" min="1" step="0.01" required
            defaultValue={existing?.price} placeholder="e.g. 200" />
        </div>

        <Textarea label="Description" name="description" defaultValue={existing?.description ?? ""}
          placeholder="Short description shown on the product card…" rows={3} />

        {/* Categories multiselect selection */}
        <div>
          <label className="text-sm font-semibold text-[#0B1F4D] block mb-2">
            Categories <span className="text-[#C41E2C]">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map((opt) => {
              const val = opt.value as ProductCategory;
              const isChecked = selectedCats.includes(val);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleCategory(val)}
                  className={[
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                    isChecked
                      ? "bg-[#0B1F4D] border-[#0B1F4D] text-white"
                      : "bg-white border-[#e2e8f0] text-slate-500 hover:border-slate-300 hover:bg-[#f8f9fb]"
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label="Display Order" name="display_order" type="number" min="0"
            defaultValue={existing?.display_order ?? 0}
            hint="Lower = shown first" />
          <div className="flex gap-6 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_available" value="true"
                defaultChecked={existing?.is_available ?? true}
                className="rounded border-slate-300 text-[#C41E2C]" />
              <span className="text-sm font-semibold text-[#0B1F4D]">Available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_coming_soon" value="true"
                defaultChecked={existing?.is_coming_soon ?? false}
                className="rounded border-slate-300 text-[#C41E2C]" />
              <span className="text-sm font-semibold text-[#0B1F4D]">Coming Soon</span>
            </label>
          </div>
        </div>

        {/* Product Images Manager */}
        <div>
          <label className="text-sm font-semibold text-[#0B1F4D] block mb-2">
            Product Images <span className="text-slate-400 font-normal">(max 10 MB per image)</span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4">
            {/* Existing images */}
            {existingImages.map((url, i) => (
              <div key={`existing-${url}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-[#e2e8f0] group bg-slate-50">
                <Image src={url} alt={`Existing ${i}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-center">
                  <span className="text-[9px] text-white font-semibold">Saved #{i+1}</span>
                </div>
              </div>
            ))}

            {/* New files preview */}
            {newFiles.map((item, i) => (
              <div key={`new-${item.preview}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-dashed border-[#0B1F4D]/30 group bg-slate-50">
                <Image src={item.preview} alt={`New ${i}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-[#0B1F4D]/80 py-0.5 text-center">
                  <span className="text-[9px] text-white font-semibold">New #{i+1}</span>
                </div>
              </div>
            ))}

            {/* Upload Box */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-[#e2e8f0] hover:border-[#0B1F4D]/40 text-slate-400 hover:text-[#0B1F4D] transition-all bg-white cursor-pointer p-4 text-center"
            >
              <Upload className="h-6 w-6 mb-2" />
              <span className="text-xs font-bold">Add Images</span>
              <span className="text-[9px] mt-1 opacity-75">Multi-select ok</span>
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            name="new_images"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading} className="flex-1"
            id={existing ? "update-product-btn" : "create-product-btn"}>
            {existing ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ── Products Manager ─────────────────────────────────────────────────────── */

export function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleFormDone = () => {
    setShowForm(false);
    setEditingProduct(null);
    // Server revalidation handles the actual fresh data on next navigation
    toast.info("Refresh to see latest changes.");
  };

  const handleToggle = async (product: Product) => {
    setTogglingId(product.id);
    const res = await toggleProductAvailability(product.id, !product.is_available);
    setTogglingId(null);
    if (res.success) {
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, is_available: !p.is_available } : p)
      );
    } else {
      toast.error(res.error ?? "Failed to toggle.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    const res = await deleteProduct(id);
    setDeletingId(null);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted.");
    } else {
      toast.error(res.error ?? "Failed to delete.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Add button */}
      {!showForm && !editingProduct && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)} variant="primary" size="sm"
            icon={<Plus className="h-4 w-4" />} id="add-product-btn">
            Add Product
          </Button>
        </div>
      )}

      {/* Form (new) */}
      {showForm && !editingProduct && (
        <ProductForm
          onDone={handleFormDone}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Form (edit) */}
      {editingProduct && (
        <ProductForm
          existing={editingProduct}
          onDone={handleFormDone}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {/* Empty state */}
      {products.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-[#0B1F4D] mb-1">No products yet</p>
          <p className="text-slate-400 text-sm">Click "Add Product" to create your first listing.</p>
        </div>
      )}

      {/* Products grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((product) => (
            <div key={product.id}
              className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}>
              {/* Image */}
              <div className="relative aspect-video bg-[#f8f9fb]">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-10 w-10 text-slate-200" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5">
                  {product.is_coming_soon && (
                    <Badge variant="warning">Coming Soon</Badge>
                  )}
                  {!product.is_available && !product.is_coming_soon && (
                    <Badge variant="error">Hidden</Badge>
                  )}
                  {product.is_available && !product.is_coming_soon && (
                    <Badge variant="success">Live</Badge>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-[#0B1F4D] text-sm leading-snug">{product.name}</h3>
                  <span className="text-[#0B1F4D] font-black text-sm shrink-0">{formatPrice(product.price)}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{(product.categories && product.categories.length > 0 ? product.categories : [product.category]).join(", ")} · Order #{product.display_order}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(product)}
                    disabled={togglingId === product.id}
                    id={`toggle-${product.id}`}
                    className={[
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                      product.is_available
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
                      togglingId === product.id ? "opacity-50 cursor-wait" : "",
                    ].join(" ")}
                  >
                    {product.is_available ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {product.is_available ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => { setEditingProduct(product); setShowForm(false); }}
                    id={`edit-${product.id}`}
                    className="px-3 py-2 rounded-xl border border-[#e2e8f0] text-[#0B1F4D] hover:bg-[#f8f9fb] transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    id={`delete-${product.id}`}
                    className="px-3 py-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
