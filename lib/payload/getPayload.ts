import config from "@payload-config";
import { getPayload as getPayloadClient } from "payload";

/** Cached Payload local API client for server components and actions. */
export async function getPayload() {
  return getPayloadClient({ config });
}
