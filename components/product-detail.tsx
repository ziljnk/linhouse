import Link from "next/link"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { ProductBookingCta } from "@/components/product-booking-cta"
import { ProductFavoriteCta } from "@/components/product-favorite-cta"
import { ProductGallery } from "@/components/product-gallery"
import { ProductGrid } from "@/components/product-grid"
import {
  catalogOptionLabel,
  collectionLabel,
  formatProductPriceVnd,
  parseProductName,
  productGallery,
  productSlug,
  productSpecRows,
  recommendedProducts,
  relatedProducts,
  showsProductPrice,
  type CatalogFilterGroup,
  type CatalogProduct,
  type CollectionItem,
} from "@/lib/catalog"

function interpolate(
  template: string,
  values: Record<string, string>
) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  )
}

function ProductRail({
  title,
  products,
  locale,
  contactLabel,
}: {
  title: string
  products: CatalogProduct[]
  locale: Locale
  contactLabel: string
}) {
  if (products.length === 0) return null

  return (
    <section className="mt-16 border-t border-charcoal/10 pt-12 sm:mt-20 sm:pt-16">
      <h2 className="mb-8 text-center font-heading text-2xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:mb-10 sm:text-3xl">
        {title}
      </h2>
      <ProductGrid
        products={products}
        locale={locale}
        contactLabel={contactLabel}
        columns={4}
        className="mx-0 max-w-none"
      />
    </section>
  )
}

export function ProductDetail({
  locale,
  product,
  catalog,
  collections: collectionItems,
  groups,
  dict,
}: {
  locale: Locale
  product: CatalogProduct
  catalog: CatalogProduct[]
  collections: CollectionItem[]
  groups: CatalogFilterGroup[]
  dict: Dictionary
}) {
  const copy = dict.productPage
  const { code, title, shortName } = parseProductName(product.name)
  const images = productGallery(product)
  const related = relatedProducts(catalog, product)
  const recommended = recommendedProducts(catalog, product, related)
  const specs = productSpecRows(product, groups)
  const silhouette = catalogOptionLabel(groups, "silhouette", product.silhouette)
  const neckline = catalogOptionLabel(groups, "neckline", product.neckline)
  const fabric = catalogOptionLabel(groups, "fabric", product.fabric)
  const collections = product.collections.map((slug) => ({
    slug,
    label: collectionLabel(collectionItems, slug),
  }))
  const primaryCollection = collections[0]
  const specSummary = specs.map((spec) => spec.value).join(". ")
  const lead =
    product.description ||
    (product.kind === "ao-dai"
      ? interpolate(copy.leadAoDai, {
          name: shortName,
          details: specSummary ? ` ${specSummary}` : "",
        })
      : interpolate(copy.lead, {
          name: shortName,
          silhouette,
          neckline,
          fabric,
        }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 xl:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery
            images={images}
            alt={product.name}
            prevLabel={copy.prevImage}
            nextLabel={copy.nextImage}
            thumbnailLabel={copy.thumbnail}
          />
        </div>

        <div className="mt-8 lg:mt-0">
          <nav className="mb-6 text-[11px] tracking-[0.12em] text-charcoal/50 uppercase">
            <Link href={`/${locale}`} className="hover:text-burgundy">
              {copy.home}
            </Link>
            {primaryCollection ? (
              <>
                <span className="mx-2">/</span>
                <Link
                  href={`/${locale}/catalog/${primaryCollection.slug}`}
                  className="hover:text-burgundy"
                >
                  {primaryCollection.label}
                </Link>
              </>
            ) : null}
            <span className="mx-2">/</span>
            <span className="text-charcoal">{shortName}</span>
          </nav>

          <p className="text-[11px] tracking-[0.18em] text-gold uppercase">
            {code}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-medium tracking-[0.08em] text-burgundy-deep uppercase sm:text-4xl">
            {shortName}
          </h1>
          <p className="mt-3 text-sm font-light tracking-[0.04em] text-charcoal/70">
            {title}
          </p>
          {showsProductPrice(product) && product.priceVnd != null ? (
            <p className="mt-5 font-heading text-xl tracking-[0.08em] text-burgundy sm:text-2xl">
              {formatProductPriceVnd(product.priceVnd)}
            </p>
          ) : null}

          <p className="mt-8 text-sm leading-relaxed font-light text-charcoal/80">
            {lead}
          </p>
          {product.description ? null : (
            <p className="mt-4 text-sm leading-relaxed font-light text-charcoal/80">
              {copy.body}
            </p>
          )}

          <dl className="mt-10 divide-y divide-charcoal/10 border-y border-charcoal/10">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline justify-between gap-4 py-3.5"
              >
                <dt className="text-[11px] tracking-[0.16em] text-charcoal/50 uppercase">
                  {spec.label}
                </dt>
                <dd className="text-sm font-light text-charcoal">{spec.value}</dd>
              </div>
            ))}
            {collections.length > 0 ? (
              <div className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="text-[11px] tracking-[0.16em] text-charcoal/50 uppercase">
                  {copy.collection}
                </dt>
                <dd className="text-right text-sm font-light text-charcoal">
                  {collections.map((collection, index) => (
                    <span key={collection.slug}>
                      {index > 0 ? ", " : null}
                      <Link
                        href={`/${locale}/catalog/${collection.slug}`}
                        className="hover:text-burgundy"
                      >
                        {collection.label}
                      </Link>
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <ProductBookingCta
              label={copy.book}
              locale={locale}
              brand={dict.brand}
              booking={dict.booking}
              storeAddress={dict.footer.company.address}
              product={{
                slug: productSlug(product),
                name: product.name,
              }}
            />
            <ProductFavoriteCta
              slug={productSlug(product)}
              name={product.name}
              image={product.image}
              addLabel={copy.addToWishlist}
              removeLabel={copy.removeFromWishlist}
            />
          </div>

          <section className="mt-12">
            <h2 className="text-[11px] tracking-[0.18em] text-gold uppercase">
              {copy.details}
            </h2>
            <p className="mt-3 text-sm leading-relaxed font-light text-charcoal/75">
              {[title, specSummary].filter(Boolean).join(". ")}.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-[11px] tracking-[0.18em] text-gold uppercase">
              {copy.careTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed font-light text-charcoal/75">
              {copy.care}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-[11px] tracking-[0.18em] text-gold uppercase">
              {copy.shippingTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed font-light text-charcoal/75">
              {copy.shipping}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-[11px] tracking-[0.18em] text-gold uppercase">
              {copy.madeToMeasureTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed font-light text-charcoal/75">
              {copy.madeToMeasure}
            </p>
          </section>
        </div>
      </div>

      <ProductRail
        title={copy.related}
        products={related}
        locale={locale}
        contactLabel={dict.products.contact}
      />
      <ProductRail
        title={copy.youMayAlsoLike}
        products={recommended}
        locale={locale}
        contactLabel={dict.products.contact}
      />
    </div>
  )
}
