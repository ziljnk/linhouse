import { toast } from "@/components/ui/toast"

export function toastSuccess(title: string, description?: string) {
  toast.add({ type: "success", title, description })
}

export function toastError(title: string, description?: string) {
  toast.add({ type: "error", title, description })
}

export function toastInfo(title: string, description?: string) {
  toast.add({ type: "info", title, description })
}
