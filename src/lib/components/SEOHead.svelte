<!--
  SEOHead - Centralized SEO meta tags component

  This component provides a consistent way to manage SEO meta tags across all pages,
  ensuring proper title formatting, meta descriptions, Open Graph tags, and Schema.org markup.
-->
<script lang="ts">
  import { page } from "$app/stores";
  import { siteConfig, getAbsoluteUrl } from "$lib/config/site";

  interface Props {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    imageAlt?: string;
    imageWidth?: number;
    imageHeight?: number;
    imageType?: string;
    type?: "website" | "article" | "product" | "place";
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    structuredData?: any;
    canonical?: string;
    noindex?: boolean;
    nofollow?: boolean;
    // Product-specific props
    price?: string;
    currency?: string;
    availability?: string;
    // Place-specific props
    address?: string;
    latitude?: string;
    longitude?: string;
    rating?: number;
    ratingCount?: number;
  }

  let {
    title,
    description,
    keywords = "",
    image,
    imageAlt,
    imageWidth,
    imageHeight,
    imageType,
    type = "website",
    publishedTime,
    modifiedTime,
    author,
    structuredData,
    canonical,
    noindex = false,
    nofollow = false,
    price,
    currency = "IDR",
    availability,
    address,
    latitude,
    longitude,
    rating,
    ratingCount,
  }: Props = $props();

  // Use provided image dimensions/type or fall back to siteConfig defaults
  const ogImageWidth = $derived(imageWidth || siteConfig.openGraph.imageWidth);
  const ogImageHeight = $derived(imageHeight || siteConfig.openGraph.imageHeight);
  const ogImageType = $derived(imageType || siteConfig.openGraph.imageType);

  // Ensure title includes site name
  const pageTitle = $derived(
    title.includes(siteConfig.name) ? title : `${title} - ${siteConfig.name}`,
  );

  // Truncate description to optimal length
  const pageDescription = $derived(
    description.length > 160
      ? description.substring(0, 157) + "..."
      : description,
  );

  // Determine canonical URL
  const pageUrl = $derived(
    canonical ? getAbsoluteUrl(canonical) : getAbsoluteUrl($page.url.pathname),
  );

  // Handle image URLs
  const ogImage = $derived(
    image
      ? image.startsWith("http")
        ? image
        : getAbsoluteUrl(image)
      : getAbsoluteUrl(siteConfig.openGraph.defaultImage),
  );

  const ogImageAlt = $derived(imageAlt || `${title} - ${siteConfig.name}`);

  // Robots meta content
  const robotsContent = $derived.by(() => {
    const directives: string[] = [];
    if (noindex) directives.push("noindex");
    if (nofollow) directives.push("nofollow");
    if (directives.length === 0) directives.push("index", "follow");
    return directives.join(", ");
  });

  // Basic structured data for website
  const baseStructuredData = $derived({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/explore?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
</script>

<svelte:head>
  <!-- Primary Meta Tags -->
  <title>{pageTitle}</title>
  <meta name="title" content={pageTitle} />
  <meta name="description" content={pageDescription} />
  {#if keywords}
    <meta name="keywords" content={keywords} />
  {/if}
  <meta name="robots" content={robotsContent} />
  <meta name="author" content={author || siteConfig.name} />

  <!-- Canonical URL -->
  <link rel="canonical" href={pageUrl} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={type} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:url" content={pageUrl} />
  <meta property="og:site_name" content={siteConfig.name} />
  <meta property="og:locale" content={siteConfig.locale} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={ogImageAlt} />
  <meta property="og:image:width" content={ogImageWidth} />
  <meta property="og:image:height" content={ogImageHeight} />
  <meta property="og:image:type" content={ogImageType} />

  {#if type === "article" && publishedTime}
    <meta property="article:published_time" content={publishedTime} />
  {/if}
  {#if type === "article" && modifiedTime}
    <meta property="article:modified_time" content={modifiedTime} />
  {/if}
  {#if type === "article" && author}
    <meta property="article:author" content={author} />
  {/if}

  <!-- Product-specific Open Graph -->
  {#if type === "product" && price}
    <meta property="product:price:amount" content={price} />
    <meta property="product:price:currency" content={currency} />
  {/if}
  {#if type === "product" && availability}
    <meta property="product:availability" content={availability} />
  {/if}

  <!-- Place-specific Open Graph -->
  {#if type === "place" && address}
    <meta property="place:location:address" content={address} />
  {/if}
  {#if type === "place" && latitude && longitude}
    <meta property="place:location:latitude" content={latitude} />
    <meta property="place:location:longitude" content={longitude} />
  {/if}

  <!-- Twitter Card -->
  <meta name="twitter:card" content={siteConfig.twitter.cardType} />
  <meta name="twitter:site" content={siteConfig.twitter.site} />
  <meta name="twitter:creator" content={siteConfig.twitter.handle} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={ogImage} />
  <meta name="twitter:image:alt" content={ogImageAlt} />

  <!-- Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify(baseStructuredData)}</script>`}

  {#if structuredData}
    {#if Array.isArray(structuredData)}
      {#each structuredData as data}
        {@html `<script type="application/ld+json">${JSON.stringify(data)}</script>`}
      {/each}
    {:else}
      {@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
    {/if}
  {/if}
</svelte:head>

