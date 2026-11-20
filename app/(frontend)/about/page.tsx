import type { Metadata } from "next";

import { AboutPage } from "@/components/about/AboutPage";

export const metadata: Metadata = {
  title: "About — Malinda Creative",
  description:
    "Malinda Creative is a studio for direction, photography, and film — images that hold still long enough to mean something.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
