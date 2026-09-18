"use server"

import { submitAppointment } from "@/lib/appointments"
import type { ActionResult } from "@/lib/admin-actions"

export async function submitAppointmentAction(
  formData: FormData
): Promise<ActionResult> {
  return submitAppointment(formData)
}
