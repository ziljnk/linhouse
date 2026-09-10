export const metadata = {
  title: "Blog",
}

export default function AdminBlogPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý bài viết sẽ được bổ sung sau.
        </p>
      </div>
    </div>
  )
}
