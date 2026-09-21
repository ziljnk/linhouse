import type { ImgHTMLAttributes } from "react"
import { resolveCmsImageSources } from "@/lib/cms-image"
import { cn } from "@/lib/utils"

type NativeImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "alt"
>

export type OptimizedImageProps = NativeImageProps & {
  /** Directory key under /uploads. Builds 400w/800w/1200w srcSet when variants exist. */
  storageKey?: string
  /** Direct URL for legacy CMS records (`/uploads/foo.jpg`) or remote images. */
  src?: string
  alt: string
  fill?: boolean
}

export function OptimizedImage({
  storageKey,
  src,
  alt,
  sizes,
  className,
  loading = "lazy",
  decoding = "async",
  width,
  height,
  fill = false,
  fetchPriority,
  ...rest
}: OptimizedImageProps) {
  const sources = resolveCmsImageSources({ storageKey, src })
  if (!sources) return null

  return (
    // Native img: Next.js optimizer returns 400 for /uploads on this host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={sources.src}
      srcSet={sources.srcSet}
      sizes={sources.srcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={cn(fill ? "absolute inset-0 size-full" : "block", className)}
    />
  )
}
