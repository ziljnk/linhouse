import { ProductForm } from "@/components/admin/product-form"

export const metadata = {
  title: "Sản phẩm",
}

export default function AdminProductsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sản phẩm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thêm sản phẩm mới và sắp xếp ảnh trưng bày.
        </p>
      </div>
      <ProductForm />
    </div>
  )
}
