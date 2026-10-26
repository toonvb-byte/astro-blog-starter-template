/**
 * Astro integration: after the build, removes EXIF/XMP/IPTC metadata (including GPS location from phone photos)
 * from every image in the published output. Astro's resized versions are already clean, but Astro also publishes
 * an untouched copy of each original upload; that copy is re-encoded here without metadata.
 * Note: the source files in src/assets (the Git repository) are not changed by this.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXT = /\.(jpe?g|png|webp|avif|tiff?)$/i;

function* walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === "_worker.js") continue;
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(p);
		else if (EXT.test(entry.name)) yield p;
	}
}

export default function stripImageMetadata() {
	return {
		name: "strip-image-metadata",
		hooks: {
			"astro:build:done": async ({ dir, logger }) => {
				let sharp;
				try {
					sharp = (await import("sharp")).default;
				} catch {
					logger.warn("sharp is not installed, so image metadata was not removed.");
					return;
				}
				const root = fileURLToPath(dir);
				let cleaned = 0;
				for (const file of walk(root)) {
					const meta = await sharp(file).metadata();
					if (!meta.exif && !meta.xmp && !meta.iptc) continue;
					// rotate() applies the EXIF orientation before the tag is dropped, so the picture stays upright.
					let img = sharp(file).rotate();
					if (meta.format === "jpeg") img = img.jpeg({ quality: 90, mozjpeg: true });
					else if (meta.format === "png") img = img.png();
					else if (meta.format === "webp") img = img.webp({ quality: 90 });
					else if (meta.format === "avif") img = img.avif({ quality: 70 });
					else if (meta.format === "tiff") img = img.tiff();
					fs.writeFileSync(file, await img.toBuffer());
					cleaned++;
				}
				logger.info(`Removed metadata (EXIF/GPS) from ${cleaned} image${cleaned === 1 ? "" : "s"}.`);
			},
		},
	};
}
