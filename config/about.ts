/**
 * About page sample content.
 * Swap strings and image paths when real studio copy and photography are ready.
 */

export type AboutService = {
  name: string;
  description: string;
};

export type AboutGalleryItem = {
  src: string;
  caption: string;
};

export type AboutContent = {
  eyebrow: string;
  brand: string;
  heroLine: string;
  intro: string;
  facts: [string, string][];
  approach: string[];
  services: AboutService[];
  gallery: AboutGalleryItem[];
  closeLine: string;
};

export const aboutContent: AboutContent = {
  eyebrow: "About",
  brand: "Malinda Creative",
  heroLine:
    "A studio for images that hold still long enough to mean something.",
  intro:
    "We shape direction, photography, and film for brands that want their work to feel considered — not loud.",
  facts: [
    ["Based in", "Colombo"],
    ["Focus", "Direction · Photography · Film"],
    ["Working since", "2019"],
    ["Selected for", "Editorial · Campaign · Brand"],
  ],
  approach: [
    "Placeholder approach. Every project begins with a clear frame — what must be felt before anything is shown — then we build the image language around that single idea.",
    "Placeholder approach. Light, material, and timing do most of the talking. We keep the set lean so the subject stays honest, and the edit stays quiet.",
  ],
  services: [
    {
      name: "Direction",
      description: "Creative direction and art direction for campaigns, lookbooks, and brand films.",
    },
    {
      name: "Photography",
      description: "Still photography with an editorial eye — product, portrait, and place.",
    },
    {
      name: "Film",
      description: "Short-form film and moving image that sits beside the stills, not apart from them.",
    },
    {
      name: "Brand",
      description: "Visual identity support when the image system needs to hold across touchpoints.",
    },
  ],
  gallery: [
    { src: "/slides/img1.jpg", caption: "Studio" },
    { src: "/slides/img5.jpg", caption: "Process" },
    { src: "/slides/img7.jpg", caption: "Light" },
    { src: "/slides/img9.jpg", caption: "Set" },
  ],
  closeLine: "Have a project in mind? Let’s talk through it.",
};
