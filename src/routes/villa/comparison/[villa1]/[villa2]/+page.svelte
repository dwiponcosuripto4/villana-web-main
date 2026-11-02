<script lang="ts">
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import ComparisonTable from "$lib/components/ComparisonTable.svelte";
  import {
    siteConfig,
    getAbsoluteUrl,
    formatMetaDescription,
  } from "$lib/config/site";
  import { formatPrice } from "$lib/utils/format";
  import GoogleAnalytics from "$lib/components/GoogleAnalytics.svelte";
  import ClarityCode from "$lib/components/ClarityCode.svelte";

  export let data: PageData;

  $: villa1 = data.villa1;
  $: villa2 = data.villa2;

  function handleClose() {
    // Go back to the previous page, or to landing page if no history
    if (history.length > 1) {
      history.back();
    } else {
      goto("/");
    }
  }

  // Meta data preparation
  $: pageTitle = `${villa1.title} vs ${villa2.title} - Villa Comparison | ${siteConfig.name}`;
  $: pageUrl = getAbsoluteUrl(
    `/villa/comparison/${villa1.slug}/${villa2.slug}`,
  );
  // $: villa1Bedrooms =
  //   villa1.bedroomMin === villa1.bedroomMax
  //     ? `${villa1.bedroomMin} BR`
  //     : `${villa1.bedroomMin}-${villa1.bedroomMax} BR`;
  // $: villa2Bedrooms =
  //   villa2.bedroomMin === villa2.bedroomMax
  //     ? `${villa2.bedroomMin} BR`
  //     : `${villa2.bedroomMin}-${villa2.bedroomMax} BR`;
  $: pageDescription = `Perbandingan villa antara ${villa1.title} vs ${villa2.title}. dibandingkan secara side-by-side antar harga, fasilitas, dan fitur.`;

  // Use first villa's primary image or fallback
  $: primaryImage =
    villa1.images?.length > 0
      ? villa1.images[0].imageUrl
      : villa2.images?.length > 0
        ? villa2.images[0].imageUrl
        : siteConfig.openGraph.defaultImage;
  $: imageAlt = `${villa1.title} vs ${villa2.title} - Perbandingan Villa`;
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />

  <!-- Open Graph Tags -->
  <meta
    property="og:title"
    content="{villa1.title} vs {villa2.title} - Perbandingan Villa"
  />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={pageUrl} />
  <meta property="og:site_name" content={siteConfig.name} />
  <meta property="og:locale" content={siteConfig.locale} />
  <meta
    property="og:image"
    content={data.ogImageUrl || (primaryImage.startsWith("http")
      ? primaryImage
      : getAbsoluteUrl(primaryImage))}
  />
  <meta property="og:image:width" content={siteConfig.openGraph.imageWidth} />
  <meta property="og:image:height" content={siteConfig.openGraph.imageHeight} />
  <meta property="og:image:alt" content={imageAlt} />

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content={siteConfig.twitter.cardType} />
  <meta name="twitter:site" content={siteConfig.twitter.site} />
  <meta name="twitter:title" content="{villa1.title} vs {villa2.title}" />
  <meta name="twitter:description" content={pageDescription} />
  <meta
    name="twitter:image"
    content={data.ogImageUrl || (primaryImage.startsWith("http")
      ? primaryImage
      : getAbsoluteUrl(primaryImage))}
  />
  <meta name="twitter:image:alt" content={imageAlt} />

  <!-- Canonical URL -->
  <link rel="canonical" href={pageUrl} />

  <!-- JSON-LD Structured Data for Comparison -->
  {@html `<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "ItemList",
			"name": "${villa1.title} vs ${villa2.title} - Villa Comparison",
			"description": "${pageDescription.replace(/"/g, '\\"')}",
			"url": "${pageUrl}",
			"numberOfItems": 2,
			"itemListElement": [
				{
					"@type": "ListItem",
					"position": 1,
					"item": {
						"@type": "RealEstateListing",
						"name": "${villa1.title}",
						"url": "${getAbsoluteUrl("/villa/" + villa1.slug)}",
						"address": {
							"@type": "PostalAddress",
							"streetAddress": "${villa1.address}",
							"addressCountry": "ID"
						},
						"numberOfRooms": ${villa1.bedroomMax},
						"offers": {
							"@type": "Offer",
							"priceCurrency": "IDR",
							"price": "${villa1.priceMin}"
						}
					}
				},
				{
					"@type": "ListItem",
					"position": 2,
					"item": {
						"@type": "RealEstateListing",
						"name": "${villa2.title}",
						"url": "${getAbsoluteUrl("/villa/" + villa2.slug)}",
						"address": {
							"@type": "PostalAddress",
							"streetAddress": "${villa2.address}",
							"addressCountry": "ID"
						},
						"numberOfRooms": ${villa2.bedroomMax},
						"offers": {
							"@type": "Offer",
							"priceCurrency": "IDR",
							"price": "${villa2.priceMin}"
						}
					}
				}
			]
		}
	</script>`}

  <GoogleAnalytics />
  <ClarityCode />
</svelte:head>

<ComparisonTable
  villaId1={villa1.id}
  villaId2={villa2.id}
  onClose={handleClose}
/>
