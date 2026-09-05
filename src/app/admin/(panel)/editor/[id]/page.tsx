import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/content-editor";
import { getContentById, listMedia } from "@/lib/db";
import { CONTENT_KINDS, type ContentKind } from "@/lib/types";

export default async function EditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  const [{ id }, query, media] = await Promise.all([params, searchParams, listMedia(50)]);
  const initialType: ContentKind = CONTENT_KINDS.includes(query.type as ContentKind) ? query.type as ContentKind : "article";
  const item = id === "new" ? null : await getContentById(id);
  if (id !== "new" && !item) notFound();
  return <ContentEditor initialItem={item} initialType={initialType} initialMedia={media} />;
}
