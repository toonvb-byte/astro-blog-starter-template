/**
 * Rehype plugin: an image on its own line with a title — ![alt](src "Caption") — becomes
 * <figure><img><figcaption>Caption</figcaption></figure>. In Keystatic the title is the image's "Caption" field.
 * Runs before Astro's own image optimisation, which then replaces the <img> inside the figure.
 * Every body image also gets widths + sizes, so Astro serves a responsive srcset instead of the full-size file.
 */
const isBlank = (n) => n.type === "text" && !n.value.trim();

/** Body images are shown in the 760 px text column: serve 400–1520 px versions instead of the full upload. */
const BODY_WIDTHS = [400, 760, 1140, 1520];
const BODY_SIZES = "(max-width: 860px) calc(100vw - 32px), 760px";

export default function rehypeFigureCaptions() {
	return (tree) => {
		const sizeImages = (node) => {
			if (node.type === "element" && node.tagName === "img" && node.properties && !node.properties.widths) {
				node.properties.widths = BODY_WIDTHS;
				node.properties.sizes = BODY_SIZES;
			}
			for (const child of node.children ?? []) sizeImages(child);
		};
		sizeImages(tree);
		const walk = (node) => {
			if (!node.children) return;
			node.children = node.children.map((child) => {
				if (child.type === "element" && child.tagName === "p") {
					const content = child.children.filter((c) => !isBlank(c));
					const img = content[0];
					if (content.length === 1 && img.type === "element" && img.tagName === "img" && img.properties?.title) {
						const caption = String(img.properties.title);
						delete img.properties.title;
						return {
							type: "element",
							tagName: "figure",
							properties: { className: ["body-figure"] },
							children: [img, { type: "element", tagName: "figcaption", properties: {}, children: [{ type: "text", value: caption }] }],
						};
					}
				}
				walk(child);
				return child;
			});
		};
		walk(tree);
	};
}
