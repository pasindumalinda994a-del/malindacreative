import type { GlobalConfig } from "payload";

import { anyone, authenticated } from "@/access";

export const MeetingAvailability: GlobalConfig = {
  slug: "meeting-availability",
  label: "Meeting Availability",
  admin: {
    description: "Weekly availability, blackouts, and public copy for /schedule.",
  },
  access: {
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Public copy",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              defaultValue: "Schedule a meeting",
            },
            {
              name: "supportingLine",
              type: "textarea",
              required: true,
              defaultValue:
                "A short conversation about your next project — pick a time that works.",
            },
            {
              name: "successCopy",
              type: "textarea",
              required: true,
              defaultValue: "You're booked. A confirmation will follow by email.",
            },
          ],
        },
        {
          label: "Availability",
          fields: [
            {
              name: "timezone",
              type: "text",
              required: true,
              defaultValue: "Asia/Colombo",
              admin: {
                description: "IANA timezone, e.g. Asia/Colombo or America/New_York.",
              },
            },
            {
              name: "slotMinutes",
              type: "number",
              required: true,
              defaultValue: 30,
              min: 15,
              max: 120,
              admin: {
                description: "Length of each bookable slot in minutes.",
              },
            },
            {
              name: "bufferMinutes",
              type: "number",
              required: true,
              defaultValue: 0,
              min: 0,
              max: 120,
              admin: {
                description: "Padding after each confirmed meeting before the next slot.",
              },
            },
            {
              name: "leadTimeHours",
              type: "number",
              required: true,
              defaultValue: 24,
              min: 0,
              admin: {
                description: "Minimum hours from now before a slot can be booked.",
              },
            },
            {
              name: "horizonDays",
              type: "number",
              required: true,
              defaultValue: 28,
              min: 1,
              max: 90,
              admin: {
                description: "How many days ahead booking is open.",
              },
            },
            {
              name: "weekly",
              type: "array",
              labels: { singular: "Window", plural: "Weekly windows" },
              admin: {
                description: "Recurring open windows. Times are local to the timezone above.",
              },
              fields: [
                {
                  name: "weekday",
                  type: "select",
                  required: true,
                  options: [
                    { label: "Sunday", value: "0" },
                    { label: "Monday", value: "1" },
                    { label: "Tuesday", value: "2" },
                    { label: "Wednesday", value: "3" },
                    { label: "Thursday", value: "4" },
                    { label: "Friday", value: "5" },
                    { label: "Saturday", value: "6" },
                  ],
                },
                {
                  name: "startTime",
                  type: "text",
                  required: true,
                  defaultValue: "10:00",
                  admin: {
                    description: "HH:mm (24h)",
                  },
                },
                {
                  name: "endTime",
                  type: "text",
                  required: true,
                  defaultValue: "17:00",
                  admin: {
                    description: "HH:mm (24h)",
                  },
                },
              ],
              defaultValue: [
                { weekday: "1", startTime: "10:00", endTime: "13:00" },
                { weekday: "3", startTime: "14:00", endTime: "17:00" },
                { weekday: "5", startTime: "10:00", endTime: "12:00" },
              ],
            },
            {
              name: "blackouts",
              type: "array",
              labels: { singular: "Blackout", plural: "Blackouts" },
              fields: [
                {
                  name: "from",
                  type: "date",
                  required: true,
                  admin: {
                    date: { pickerAppearance: "dayOnly" },
                  },
                },
                {
                  name: "to",
                  type: "date",
                  required: true,
                  admin: {
                    date: { pickerAppearance: "dayOnly" },
                    description: "Inclusive end date.",
                  },
                },
                {
                  name: "reason",
                  type: "text",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
