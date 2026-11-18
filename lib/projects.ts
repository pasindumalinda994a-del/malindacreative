import { slides as fallbackSlides, type Slide } from "@/config/slides";
import { mediaUrl } from "@/lib/media";
import { getPayload } from "@/lib/payload/getPayload";

type MediaDoc = {
  url?: string | null;
};

type ProjectDoc = {
  slug: string;
  name: string;
  description: string;
  category: string;
  year: string;
  client: string;
  services?: { label: string }[] | null;
  intro: string;
  body?: { paragraph: string }[] | null;
  image?: MediaDoc | number | null;
  gallery?: { image?: MediaDoc | number | null }[] | null;
  testimonial?: {
    quote: string;
    author: string;
    role: string;
    portrait?: MediaDoc | number | null;
  } | null;
};

function mapProject(doc: ProjectDoc): Slide | null {
  const image = mediaUrl(doc.image);
  const portrait = mediaUrl(doc.testimonial?.portrait);
  if (!image || !doc.testimonial || !portrait) return null;

  return {
    slug: doc.slug,
    name: doc.name,
    image,
    description: doc.description,
    category: doc.category,
    year: doc.year,
    client: doc.client,
    services: (doc.services ?? []).map((s) => s.label).filter(Boolean),
    intro: doc.intro,
    body: (doc.body ?? []).map((b) => b.paragraph).filter(Boolean),
    gallery: (doc.gallery ?? [])
      .map((g) => mediaUrl(g.image))
      .filter(Boolean),
    testimonial: {
      quote: doc.testimonial.quote,
      author: doc.testimonial.author,
      role: doc.testimonial.role,
      portrait,
    },
  };
}

/**
 * Featured published projects from Payload, sorted by `order`.
 * Falls back to static `config/slides` when the DB is empty or unreachable.
 */
export async function getFeaturedProjects(): Promise<Slide[]> {
  try {
    const payload = await getPayload();
    const result = await payload.find({
      collection: "projects",
      depth: 2,
      limit: 50,
      sort: "order",
      where: {
        and: [
          { featured: { equals: true } },
          { _status: { equals: "published" } },
        ],
      },
      overrideAccess: true,
    });

    const mapped = (result.docs as unknown as ProjectDoc[])
      .map(mapProject)
      .filter((slide): slide is Slide => slide != null);

    if (mapped.length > 0) return mapped;
  } catch (error) {
    console.warn("[projects] Falling back to static slides:", error);
  }

  return fallbackSlides;
}
