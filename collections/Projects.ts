import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "@/access";

export const Projects: CollectionConfig = {
  slug: "projects",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "featured", "order", "_status", "updatedAt"],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "name",
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
      name: "featured",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Show in the homepage featured strip.",
      },
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Lower numbers appear first in the strip.",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: "Hero / strip image.",
      },
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      admin: {
        description: "One-line summary beside the strip.",
      },
    },
    {
      name: "category",
      type: "text",
      required: true,
    },
    {
      name: "year",
      type: "text",
      required: true,
    },
    {
      name: "client",
      type: "text",
      required: true,
    },
    {
      name: "services",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "intro",
      type: "textarea",
      required: true,
    },
    {
      name: "body",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "paragraph",
          type: "textarea",
          required: true,
        },
      ],
    },
    {
      name: "gallery",
      type: "array",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "testimonial",
      type: "group",
      fields: [
        {
          name: "quote",
          type: "textarea",
          required: true,
        },
        {
          name: "author",
          type: "text",
          required: true,
        },
        {
          name: "role",
          type: "text",
          required: true,
        },
        {
          name: "portrait",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
  ],
};
