// Industries served (read only for now). Without a database, /content is used.
import "server-only";
import { industries as contentIndustries } from "@/content/company";
import { TAGS, cached } from "@/server/cache";
import { isDatabaseConfigured } from "@/server/config/env";
import * as industryRepository from "./industry.repository";

const loadIndustries = cached(
  () => industryRepository.findActive(),
  ["industries"],
  [TAGS.industries],
);

/** @returns {Promise<{ name: string, icon: string }[]>} */
export async function listIndustries() {
  return isDatabaseConfigured() ? loadIndustries() : contentIndustries;
}

/** @returns {Promise<{ id: string, name: string }[]>} */
export async function listOptions() {
  return industryRepository.findOptions();
}
