import type { CollectionConfig } from "payload";

import { authenticated } from "@/access";

/** Stub for future Insights / journal content. Admin-only for now. */
export const Insights: CollectionConfig = {
  slug: "insights",
  admin: {
    useAsTitle: "title",
    description: "Coming soon — scaffolded for future public Insights pages.",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "content",
      type: "richText",
    },
  ],
};
