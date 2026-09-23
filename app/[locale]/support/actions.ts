"use server"

import type { ActionResult } from "@/lib/admin-actions"
import { submitSupportMessage } from "@/lib/support-message"

export async function submitSupportMessageAction(
  formData: FormData
): Promise<ActionResult> {
  return submitSupportMessage(formData)
}
