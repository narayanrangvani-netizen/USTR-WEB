import { NextResponse } from "next/server";
import { requireStoreOwner } from "@/lib/supabase/server";

export async function DELETE(_request: Request, context: { params: Promise<{ imageId: string }> }) {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;

  try {
    const { imageId } = await context.params;
    const { data: image, error: findError } = await access.service
      .from("product_images").select("id, product_id, image_url").eq("id", imageId).single();
    if (findError) return NextResponse.json({ error: "Image not found." }, { status: 404 });

    const marker = "/storage/v1/object/public/product-images/";
    const storagePath = image.image_url.split(marker)[1];
    if (storagePath) {
      const { error: storageError } = await access.service.storage.from("product-images").remove([decodeURIComponent(storagePath)]);
      if (storageError) return NextResponse.json({ error: `Could not remove the stored image: ${storageError.message}` }, { status: 400 });
    }
    const { error } = await access.service.from("product_images").delete().eq("id", imageId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: nextPrimary } = await access.service.from("product_images")
      .select("id").eq("product_id", image.product_id).order("sort_order").limit(1).maybeSingle();
    if (nextPrimary) {
      const { error: primaryError } = await access.service.from("product_images")
        .update({ is_primary: true }).eq("id", nextPrimary.id);
      if (primaryError) return NextResponse.json({ error: `Image removed, but primary image could not be updated: ${primaryError.message}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
