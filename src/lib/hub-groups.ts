/** Hub groups, in the order they appear on the supplements index. Labels live in i18n/ui.ts ("group.*"). */
export const HUB_GROUPS = ["vitamins", "minerals", "fatty", "sports", "skinJoints", "botanicals", "sleep"] as const;
export type HubGroup = (typeof HUB_GROUPS)[number];
