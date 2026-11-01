import { InfiniteSlider } from "@/components/InfiniteSlider";
import { getSlideIndexBySlug, slides } from "@/config/slides";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { project } = await searchParams;
  const slug = Array.isArray(project) ? project[0] : project;
  const initialOpenIndex = slug ? getSlideIndexBySlug(slug) : -1;

  return (
    <main>
      <InfiniteSlider slides={slides} initialOpenIndex={initialOpenIndex} />
    </main>
  );
}
