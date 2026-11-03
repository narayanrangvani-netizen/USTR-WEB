import { NextResponse } from "next/server";
import { requireStoreOwner } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;

  try {
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
    const formData = await request.formData();
    const file = formData.get("file");
    const roleValue = formData.get("role");
    const colorValue = formData.get("color");
    const imageRole = roleValue === null ? "front" : String(roleValue);
    const imageColor = colorValue ? String(colorValue).trim() : null;
    if (!["side", "front", "back", "colorway"].includes(imageRole)) {
      return NextResponse.json({ error: "Choose a valid product image view." }, { status: 400 });
    }
    if (imageRole === "colorway" && !imageColor) {
      return NextResponse.json({ error: "Choose a product colour for a colourway image." }, { status: 400 });
    }
    if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Choose a JPG, PNG, or WebP image smaller than 5 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isJpeg = file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = file.type === "image/png" && bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
    const isWebp = file.type === "image/webp" &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json({ error: "The selected file contents do not match a supported image format." }, { status: 400 });
    }

    const { data: product, error: productError } = await access.service.from("products").select("id, colors").eq("id", id).maybeSingle();
    if (productError) {
      console.error("[admin.images] Product lookup failed", { code: productError.code ?? "unknown" });
      return NextResponse.json({ error: "Could not verify the product. Try again." }, { status: 503 });
    }
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (imageRole === "colorway" && imageColor && !(product.colors as string[]).includes(imageColor)) {
      return NextResponse.json({ error: "The selected colour must be listed on this product first." }, { status: 400 });
    }

    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const storagePath = `${id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await access.service.storage
      .from("product-images")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("[admin.images] Storage upload failed", { code: uploadError.name });
      return NextResponse.json({ error: "Image upload failed. Check your storage configuration and try again." }, { status: 503 });
    }

    const { data: publicUrl } = access.service.storage.from("product-images").getPublicUrl(storagePath);
    const { data: existing, error: listError } = await access.service
      .from("product_images").select("id").eq("product_id", id);
    if (listError) {
      await access.service.storage.from("product-images").remove([storagePath]);
      console.error("[admin.images] Image list failed", { code: listError.code ?? "unknown" });
      return NextResponse.json({ error: "Image uploaded, but its product record could not be prepared. Try again." }, { status: 503 });
    }
    const { data: image, error: insertError } = await access.service
      .from("product_images")
      .insert({
        product_id: id,
        image_url: publicUrl.publicUrl,
        is_primary: existing.length === 0,
        sort_order: existing.length,
        image_role: imageRole,
        image_color: imageRole === "colorway" ? imageColor : null,
      })
      .select("id, image_url, is_primary, image_role, image_color")
      .single();
    if (insertError) {
      await access.service.storage.from("product-images").remove([storagePath]);
      console.error("[admin.images] Image record creation failed", { code: insertError.code ?? "unknown" });
      return NextResponse.json({ error: "Image uploaded, but its product record could not be saved. Try again." }, { status: 503 });
    }
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error("[admin.images] Image upload request failed", {
      kind: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "Could not upload this image. Try again." }, { status: 503 });
  }
}
