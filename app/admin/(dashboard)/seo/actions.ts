"use server"

import { actionFail, actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  staticSeoPaths,
  writeStaticPageSeo,
  type PageSeoFields,
} from "@/lib/page-seo"

export async function saveStaticPageSeoAction(values: Record<string, PageSeoFields>) {
  await requireUsableAdminSession()

  const result = await writeStaticPageSeo(values)
  if (!result.ok) return actionFail(result.error)

  await revalidateAdmin(staticSeoPaths())
  return actionOk()
}
