import { fetchGraphQL } from "@/lib/api";
import { cache } from "react";
import Link from "next/link";
import Image from "next/image";

import FooterSection from "@/components/FooterSection";
import PracticeAreasSection from "@/components/PracticeAreasSection";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

/**
 * ---------------------------------------------------
 * 1. CACHE FETCH (prevents duplicate calls)
 * ---------------------------------------------------
 */
const getHomePage = cache(async () => {
  const data = await fetchGraphQL(`
    query GetHomePage {
      page(id: "/", idType: URI) {
        title

        seo {
          title
          metaDesc
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
        }

        yoast_head_json {
          title
          description
          og_title
          og_description
          og_image {
            url
          }
          twitter_card
          robots {
            index
            follow
          }
        }

        homeFlexLayouts {
          bannerGroup {
            bannerPreTitle
            bannerTitle
            bannerTitleTag
            bannerContent
            bannerSubContent
            bannerLink {
              url
              title
              target
            }
            bannerBackground {
              node {
                sourceUrl
              }
            }
          }

          homeFlexibleContent {
            __typename

            ... on HomeFlexLayoutsHomeFlexibleContentAboutLayout {
              sectionPreTitle
              sectionTitle
              sectionTitleTag
              sectionContent
              sectionImage {
                node {
                  sourceUrl
                  altText
                }
              }
              sectionLink {
                url
                title
                target
              }
            }

            ... on HomeFlexLayoutsHomeFlexibleContentPracticeAreasLayout {
              sectionContent
              sectionPreTitle
              sectionSubContent
              sectionTitle
              sectionTitleTag
              sectionLink {
                title
                url
              }
              practiceAreasGrid(first: 100) {
                nodes {
                  ... on Page {
                    id
                    uri
                    title
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  return data?.page || null;
});

/**
 * ---------------------------------------------------
 * PAGE COMPONENT
 * ---------------------------------------------------
 */
export default async function Home() {
  const page = await getHomePage();

  if (!page) return null;

  const homeData = page.homeFlexLayouts;

  const banner = homeData?.bannerGroup;
  const BannerTitleTag = banner?.bannerTitleTag ? "h1" : "span";

  const aboutLayout = homeData?.homeFlexibleContent?.find(
    (layout: any) =>
      layout.__typename ===
      "HomeFlexLayoutsHomeFlexibleContentAboutLayout"
  );

  const AboutTitleTag = aboutLayout?.sectionTitleTag
    ? "h2"
    : "span";

  const paLayout = homeData?.homeFlexibleContent?.find(
    (l: any) =>
      l.__typename ===
      "HomeFlexLayoutsHomeFlexibleContentPracticeAreasLayout"
  );

  return (
    <div>
      <SiteHeader />

      {/* BANNER */}
      <section className="home-banner relative isolate overflow-hidden bg-cover bg-center py-24 sm:py-32">
        <Image
          src={
            banner?.bannerBackground?.node?.sourceUrl ||
            "https://griffinheadlesscms.kinsta.cloud/wp-content/uploads/2026/04/arizona-skyline-e1757520675891.webp"
          }
          alt="Banner Background"
          fill
          priority
          className="object-cover -z-10"
          sizes="100vw"
        />

        <div className="banner-overlay absolute inset-0 bg-black/40"></div>

        <div className="home-banner-cont relative mx-auto max-w-7xl px-6 lg:px-8">
          {banner?.bannerPreTitle && (
            <p className="font-bold mb-2 uppercase">
              {banner.bannerPreTitle}
            </p>
          )}

          {banner?.bannerTitle && (
            <BannerTitleTag
              className="text-5xl font-semibold text-white sm:text-7xl"
              dangerouslySetInnerHTML={{
                __html: banner.bannerTitle,
              }}
            />
          )}

          <div
            className="mt-8 text-lg max-w-2xl text-white"
            dangerouslySetInnerHTML={{
              __html: banner?.bannerContent || "",
            }}
          />

          {banner?.bannerLink && (
            <Link
              href={banner.bannerLink.url}
              className="btn-primary mt-10 inline-block"
            >
              {banner.bannerLink.title}
            </Link>
          )}
        </div>
      </section>

      {/* ABOUT */}
      {aboutLayout && (
        <section className="pt-20">
          <div className="max-w-7xl mx-auto px-6">
            <AboutTitleTag>{aboutLayout.sectionTitle}</AboutTitleTag>

            <div
              dangerouslySetInnerHTML={{
                __html: aboutLayout.sectionContent || "",
              }}
            />
          </div>
        </section>
      )}

      {paLayout && <PracticeAreasSection data={paLayout} />}

      <FooterSection />
      <SiteFooter />
    </div>
  );
}

/**
 * ---------------------------------------------------
 * 2. SEO (YOAST)
 * ---------------------------------------------------
 */
export async function generateMetadata() {
  const page = await getHomePage();

  if (!page) {
    return {
      title: "Home",
    };
  }

  const seo = page?.yoast_head_json;

  const ogImage =
    seo?.og_image?.[0]?.url ||
    page?.seo?.opengraphImage?.sourceUrl ||
    null;

  return {
    title: seo?.title || page.title,
    description: seo?.description || page?.seo?.metaDesc || "",

    openGraph: {
      title: seo?.og_title || page.title,
      description:
        seo?.og_description || page?.seo?.metaDesc || "",
      images: ogImage ? [{ url: ogImage }] : [],
    },

    twitter: {
      card: seo?.twitter_card || "summary_large_image",
      title: seo?.title || page.title,
      description: seo?.description || "",
      images: ogImage ? [ogImage] : [],
    },

    robots: seo?.robots
      ? {
          index: seo.robots.index,
          follow: seo.robots.follow,
        }
      : undefined,
  };
}
