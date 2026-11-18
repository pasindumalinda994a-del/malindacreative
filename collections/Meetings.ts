import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { authenticatedField, publicCreateAdminManage } from "@/access";

const preventOverlap: CollectionBeforeChangeHook = async ({ data, operation, req, originalDoc }) => {
  if (!data?.startsAt || !data?.endsAt) return data;
  if (data.status === "cancelled") return data;

  const startsAt = new Date(data.startsAt as string);
  const endsAt = new Date(data.endsAt as string);

  if (!(startsAt < endsAt)) {
    throw new Error("Meeting end time must be after start time.");
  }

  const excludeId =
    operation === "update" && originalDoc?.id != null ? String(originalDoc.id) : undefined;

  const overlapping = await req.payload.find({
    collection: "meetings",
    depth: 0,
    limit: 1,
    where: {
      and: [
        { status: { equals: "confirmed" } },
        { startsAt: { less_than: endsAt.toISOString() } },
        { endsAt: { greater_than: startsAt.toISOString() } },
        ...(excludeId ? [{ id: { not_equals: excludeId } }] : []),
      ],
    },
    overrideAccess: true,
  });

  if (overlapping.totalDocs > 0) {
    throw new Error("That time slot is no longer available.");
  }

  return data;
};

export const Meetings: CollectionConfig = {
  slug: "meetings",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "startsAt", "status", "createdAt"],
    description: "Booked meeting slots from the public schedule page.",
  },
  access: publicCreateAdminManage,
  hooks: {
    beforeChange: [preventOverlap],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "company",
      type: "text",
    },
    {
      name: "notes",
      type: "textarea",
      label: "Topic / notes",
    },
    {
      name: "startsAt",
      type: "date",
      required: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
      },
      index: true,
    },
    {
      name: "endsAt",
      type: "date",
      required: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
      },
    },
    {
      name: "timezone",
      type: "text",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "confirmed",
      options: [
        { label: "Confirmed", value: "confirmed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Completed", value: "completed" },
      ],
      admin: {
        position: "sidebar",
      },
      access: {
        // Public create always starts confirmed; only admins can change status.
        update: authenticatedField,
      },
    },
    {
      name: "adminNotes",
      type: "textarea",
      access: {
        read: authenticatedField,
        update: authenticatedField,
        create: authenticatedField,
      },
      admin: {
        description: "Internal notes — not visible to the visitor.",
      },
    },
  ],
};
