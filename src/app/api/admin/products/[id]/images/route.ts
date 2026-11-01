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

    const { data: product, error: productError } = await access.service.from("products").select("id").eq("id", id).maybeSingle();
    if (productError || !product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const storagePath = `${id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await access.service.storage
      .from("product-images")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 400 });

    const { data: publicUrl } = access.service.storage.from("product-images").getPublicUrl(storagePath);
    const { data: existing, error: listError } = await access.service
      .from("product_images").select("id").eq("product_id", id);
    if (listError) return NextResponse.json({ error: `Image uploaded, but image list could not be read: ${listError.message}` }, { status: 400 });
    const { data: image, error: insertError } = await access.service
      .from("product_images")
      .insert({
        product_id: id,
        image_url: publicUrl.publicUrl,
        is_primary: existing.length === 0,
        sort_order: existing.length,
      })
      .select("id, image_url, is_primary")
      .single();
    if (insertError) return NextResponse.json({ error: `Image uploaded, but its product record could not be saved: ${insertError.message}` }, { status: 400 });
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload this image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
