import { redirect } from "next/navigation";

/** Shareable deep link — opens the home strip with the schedule drawer. */
export default function SchedulePage() {
  redirect("/?schedule=1");
}
