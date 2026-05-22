import { ArticleEditorClient } from "./ArticleEditorClient"

export default async function ArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <ArticleEditorClient id={id} />
}

