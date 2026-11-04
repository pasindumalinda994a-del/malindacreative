export type Slide = {
  /** URL segment, used for `?project=<slug>` deep links. */
  slug: string;
  /** Project title. */
  name: string;
  /** Path to the hero image inside the `public` folder. */
  image: string;
  /** One-line summary shown on the homepage beside the strip. */
  description: string;
  /** Discipline shown in the meta line, e.g. "Art Direction". */
  category: string;
  /** Project year. */
  year: string;
  /** Client or project type. */
  client: string;
  /** Creative disciplines involved. */
  services: string[];
  /** Short editorial introduction (one or two sentences). */
  intro: string;
  /** Longer body copy, one paragraph per entry. */
  body: string[];
  /** Additional visuals shown further down the project page. */
  gallery: string[];
  /** Client comment shown at the bottom of the project detail. */
  testimonial: {
    quote: string;
    author: string;
    role: string;
    /** Path to a portrait inside the `public` folder. */
    portrait: string;
  };
};

// Add, remove or reorder slides here. Images live in `public/slides/`.
// Project copy below is placeholder content until the real case studies are written.
export const slides: Slide[] = [
  {
    slug: "contour",
    name: "Contour",
    image: "/slides/img1.jpg",
    description: "A study of edge and impact — tools, hands, and the line where form begins.",
    category: "Art Direction",
    year: "2026",
    client: "Placeholder Studio",
    services: ["Art Direction", "Photography", "Identity"],
    intro:
      "Placeholder intro. Contour follows a maker through a single working day, isolating the moment where pressure becomes shape.",
    body: [
      "Placeholder body copy. The series was photographed in one continuous session so that light, dust and fatigue could accumulate naturally across the frames.",
      "Placeholder body copy. Every image was composed around a single diagonal — the line of the tool — so the set reads as one gesture when shown in sequence.",
    ],
    gallery: ["/slides/img5.jpg", "/slides/img10.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. They treated the tool like a character — every frame felt deliberate without ever looking forced.",
      author: "Mira Chen",
      role: "Creative Director, Placeholder Studio",
      portrait: "/slides/img3.jpg",
    },
  },
  {
    slug: "velum-drift",
    name: "Velum Drift",
    image: "/slides/img2.jpg",
    description: "Soft layers in slow motion: texture that feels like breath across a surface.",
    category: "Motion & Texture",
    year: "2025",
    client: "Placeholder Textiles",
    services: ["Motion Design", "3D", "Campaign"],
    intro:
      "Placeholder intro. A campaign built entirely from macro footage of fabric, slowed until movement becomes weather.",
    body: [
      "Placeholder body copy. The brief asked for softness without nostalgia. We answered with grain, long shutter speeds and a palette held to three warm tones.",
      "Placeholder body copy. The 3D passes were used only to extend what the camera had already found, never to replace it.",
    ],
    gallery: ["/slides/img7.jpg", "/slides/img9.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. The motion had weight and quiet at once — our fabric finally looked like it breathed on screen.",
      author: "Elena Vos",
      role: "Brand Lead, Placeholder Textiles",
      portrait: "/slides/img7.jpg",
    },
  },
  {
    slug: "quiet-exchange",
    name: "Quiet Exchange",
    image: "/slides/img3.jpg",
    description: "Two people, one table — the pause between words where projects actually move.",
    category: "Editorial",
    year: "2025",
    client: "Placeholder Journal",
    services: ["Editorial Design", "Photography"],
    intro:
      "Placeholder intro. A photo essay about negotiation, told through the silence between two chairs.",
    body: [
      "Placeholder body copy. The images were shot from a fixed position so that only the people, not the camera, ever moved.",
      "Placeholder body copy. Typography in the printed piece mirrors that stillness: one serif, one size, generous margins.",
    ],
    gallery: ["/slides/img8.jpg", "/slides/img4.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. They found the story in the pause between sentences. The essay feels like the conversation itself.",
      author: "Jonah Reed",
      role: "Editor, Placeholder Journal",
      portrait: "/slides/img8.jpg",
    },
  },
  {
    slug: "earth-routine",
    name: "Earth Routine",
    image: "/slides/img4.jpg",
    description: "Daily craft against soil and grain; repetition as a kind of clarity.",
    category: "Documentary",
    year: "2024",
    client: "Placeholder Farm Co.",
    services: ["Documentary", "Brand Film", "Stills"],
    intro:
      "Placeholder intro. A quiet portrait of routine work, where the same gesture repeated becomes a form of attention.",
    body: [
      "Placeholder body copy. We spent four early mornings in the field with no shot list, letting rhythm dictate the frames.",
      "Placeholder body copy. The final film runs at the pace of the work itself: unhurried, repetitive, exact.",
    ],
    gallery: ["/slides/img1.jpg", "/slides/img6.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. They stayed with the work long enough to see its rhythm — the film moves at the pace of the field.",
      author: "Sam Ortiz",
      role: "Founder, Placeholder Farm Co.",
      portrait: "/slides/img4.jpg",
    },
  },
  {
    slug: "metal-echo",
    name: "Metal Echo",
    image: "/slides/img5.jpg",
    description: "Hard light on hard material — reflections that remember the last strike.",
    category: "Product",
    year: "2024",
    client: "Placeholder Metalworks",
    services: ["Product Photography", "Art Direction"],
    intro:
      "Placeholder intro. A product series where the material was allowed to be loud and everything else was asked to be quiet.",
    body: [
      "Placeholder body copy. Single hard source, black card, no retouching of the reflections — the marks of making were the point.",
      "Placeholder body copy. The set was designed to be read at a distance, which pushed every composition toward one strong shape.",
    ],
    gallery: ["/slides/img3.jpg", "/slides/img2.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. Hard light, honest marks — the product finally looked like something that had been made, not merely shown.",
      author: "Rhea Okonkwo",
      role: "Studio Head, Placeholder Metalworks",
      portrait: "/slides/img5.jpg",
    },
  },
  {
    slug: "tanned-edge",
    name: "Tanned Edge",
    image: "/slides/img6.jpg",
    description: "Warm hide and precise cuts; the boundary between raw and finished.",
    category: "Craft",
    year: "2024",
    client: "Placeholder Leather Atelier",
    services: ["Identity", "Packaging", "Photography"],
    intro:
      "Placeholder intro. An identity for a small leather atelier, built on the contrast between the raw hide and the finished edge.",
    body: [
      "Placeholder body copy. The wordmark is cut rather than drawn: straight strokes, a single angle, no curves.",
      "Placeholder body copy. Packaging uses unbleached board so the leather is always the warmest thing in the frame.",
    ],
    gallery: ["/slides/img9.jpg", "/slides/img1.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. The identity cuts as cleanly as our edges — restrained, warm, and unmistakably ours.",
      author: "Luis Andrade",
      role: "Owner, Placeholder Leather Atelier",
      portrait: "/slides/img6.jpg",
    },
  },
  {
    slug: "humidity",
    name: "Humidity",
    image: "/slides/img7.jpg",
    description: "Air that holds weight. Surfaces bloom, soften, and refuse to stay still.",
    category: "Experimental",
    year: "2023",
    client: "Self-initiated",
    services: ["Direction", "Motion", "Sound"],
    intro:
      "Placeholder intro. A self-initiated study of condensation, heat and the way surfaces behave when the air is too full.",
    body: [
      "Placeholder body copy. Shot in a single sealed room over two days as the temperature was slowly raised.",
      "Placeholder body copy. The soundtrack was recorded in the same room; the drips are real.",
    ],
    gallery: ["/slides/img2.jpg", "/slides/img8.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. A self-set bar that still feels rare — patience, atmosphere, and sound that belongs to the room.",
      author: "Malinda Creative",
      role: "Director, Self-initiated",
      portrait: "/slides/img1.jpg",
    },
  },
  {
    slug: "limestone-air",
    name: "Limestone Air",
    image: "/slides/img8.jpg",
    description: "Pale dust and open space — architecture breathing through porous stone.",
    category: "Architecture",
    year: "2023",
    client: "Placeholder Architects",
    services: ["Architectural Photography", "Book Design"],
    intro:
      "Placeholder intro. A monograph for an architecture practice whose work is mostly air held in place by stone.",
    body: [
      "Placeholder body copy. Images were made only in overcast light so that the limestone could be read as tone rather than texture.",
      "Placeholder body copy. The book is bound uncoated, with a single ink, and opens flat.",
    ],
    gallery: ["/slides/img4.jpg", "/slides/img10.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. They photographed air as carefully as stone — the monograph holds the same quiet we build into rooms.",
      author: "Aya Nomura",
      role: "Partner, Placeholder Architects",
      portrait: "/slides/img2.jpg",
    },
  },
  {
    slug: "warm-surface",
    name: "Warm Surface",
    image: "/slides/img9.jpg",
    description: "Heat held in material. A close reading of color where skin meets light.",
    category: "Beauty",
    year: "2023",
    client: "Placeholder Skincare",
    services: ["Campaign", "Photography", "Retouching"],
    intro:
      "Placeholder intro. A skincare campaign that treats skin as a landscape — close, warm and unretouched beyond color.",
    body: [
      "Placeholder body copy. One lens, one focal distance, natural window light for every frame in the set.",
      "Placeholder body copy. Color grading was done in print first, then matched on screen, not the other way around.",
    ],
    gallery: ["/slides/img6.jpg", "/slides/img3.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. Close, warm, and honest — the campaign treats skin as landscape without ever turning clinical.",
      author: "Priya Nair",
      role: "Marketing Director, Placeholder Skincare",
      portrait: "/slides/img9.jpg",
    },
  },
  {
    slug: "dust-and-craft",
    name: "Dust & Craft",
    image: "/slides/img10.jpg",
    description: "The residue of making: particles, patience, and the work left on the bench.",
    category: "Workshop",
    year: "2022",
    client: "Placeholder Woodworks",
    services: ["Brand Film", "Stills", "Web"],
    intro:
      "Placeholder intro. A brand film and stills set for a woodworking studio, shot entirely after hours when only the dust is moving.",
    body: [
      "Placeholder body copy. We lit the workshop from a single doorway and waited for the air to settle between takes.",
      "Placeholder body copy. The website carries the same restraint: one column, one typeface, images that load slowly on purpose.",
    ],
    gallery: ["/slides/img5.jpg", "/slides/img7.jpg"],
    testimonial: {
      quote:
        "Placeholder client note. They waited for the dust to settle — the film and stills feel like the workshop after hours.",
      author: "Tomás Hale",
      role: "Principal, Placeholder Woodworks",
      portrait: "/slides/img10.jpg",
    },
  },
];

export function getSlideBySlug(slug: string) {
  return slides.find((slide) => slide.slug === slug);
}

export function getSlideIndexBySlug(slug: string) {
  return slides.findIndex((slide) => slide.slug === slug);
}

export function getNextSlide(index: number) {
  return slides[(index + 1) % slides.length];
}
