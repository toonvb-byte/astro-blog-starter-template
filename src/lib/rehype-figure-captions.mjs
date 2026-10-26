/**
 * Rehype plugin: an image on its own line with a title — ![alt](src "Caption") — becomes
 * <figure><img><figcaption>Caption</figcaption></figure>. In Keystatic the title is the image's "Caption" field.
 * Runs before Astro's own image optimisation, which then replaces the <img> inside the figure.
 */
const isBlank = (n) => n.type === "text" && !n.value.trim();

export default function rehypeFigureCaptions() {
	return (tree) => {
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
