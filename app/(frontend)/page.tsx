import { InfiniteSlider } from "@/components/InfiniteSlider";
import { ScheduleDeepLink } from "@/components/schedule/ScheduleDeepLink";
import { getSlideIndexBySlug } from "@/config/slides";
import { getFeaturedProjects } from "@/lib/projects";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const project = params.project;
  const slug = Array.isArray(project) ? project[0] : project;
  const scheduleParam = params.schedule;
  const scheduleValue = Array.isArray(scheduleParam) ? scheduleParam[0] : scheduleParam;
  const openSchedule =
    scheduleValue === "1" ||
    scheduleValue === "true" ||
    scheduleValue === "open" ||
    scheduleValue === "";

  const slides = await getFeaturedProjects();
  const initialOpenIndex = slug ? getSlideIndexBySlug(slides, slug) : -1;

  return (
    <main data-page="home">
      <ScheduleDeepLink shouldOpen={openSchedule} />
      <InfiniteSlider slides={slides} initialOpenIndex={initialOpenIndex} />
    </main>
  );
}
