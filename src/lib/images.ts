/**
 * Image helpers: social card (og:image) and Article schema crops from a page's hero image.
 * Crops are made at build time by Astro's image service (sharp), which also drops EXIF/GPS metadata.
 * Pages without a hero use the fallback card in /public/og-default.png.
 */
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import { SITE_NAME, SITE_URL } from "./site";

export interface SocialImage { url: string; width: number; height: number; alt: string }

export const DEFAULT_SOCIAL_IMAGE: SocialImage = {
	url: `${SITE_URL}/og-default.png`,
	width: 1200,
	height: 630,
	alt: SITE_NAME,
};

const abs = (p: string) => new URL(p, SITE_URL).href;

/** 1200×630 JPEG for og:image / twitter:image. */
export async function socialImage(img: ImageMetadata, alt: string): Promise<SocialImage> {
	const og = await getImage({ src: img, width: 1200, height: 630, fit: "cover", position: "center", format: "jpg", quality: 80 });
	return { url: abs(og.src), width: 1200, height: 630, alt };
}

/** 16:9, 4:3 and 1:1 crops for the `image` property of Article / CollectionPage schema (Google: ≥ 50,000 px each). */
export async function schemaImages(img: ImageMetadata): Promise<string[]> {
	const sizes: [number, number][] = [[1600, 900], [1200, 900], [1200, 1200]];
	const out = await Promise.all(
		sizes.map(([width, height]) => getImage({ src: img, width, height, fit: "cover", position: "center", format: "jpg", quality: 80 })),
	);
	return out.map((o) => abs(o.src));
}

/** Widths and sizes for a hero shown in the 760 px text column. */
export const HERO_WIDTHS = [400, 760, 1140, 1520];
export const HERO_SIZES = "(max-width: 860px) calc(100vw - 32px), 760px";
