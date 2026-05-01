export type LookupSource = "user" | "system";

export type LookupRow = {
  key: string;
  values: Record<string, string>;
};

export type LookupTable = {
  id: string;
  name: string;
  source: LookupSource;
  description: string;
  lookupField: string;
  prefix: string;
  fields: string[];
  rows: LookupRow[];
};

export const LOOKUPS: LookupTable[] = [
  {
    id: "/lookups/application_catalog",
    name: "application_catalog",
    source: "user",
    description: "Internal app inventory. Maps app_id to app metadata.",
    lookupField: "app_id",
    prefix: "cat_",
    fields: ["app_name", "tier", "sensitivity", "owner_team"],
    rows: [
      {
        key: "FA-01",
        values: {
          app_name: "Fund Accounting",
          tier: "T1",
          sensitivity: "business-critical",
          owner_team: "Platform-SRE-B",
        },
      },
      {
        key: "PM-02",
        values: {
          app_name: "Portfolio Manager",
          tier: "T1",
          sensitivity: "business-critical",
          owner_team: "Wealth-Eng",
        },
      },
      {
        key: "WP-04",
        values: {
          app_name: "Wealth Portal API",
          tier: "T2",
          sensitivity: "customer-facing",
          owner_team: "Platform-Web",
        },
      },
      {
        key: "NOT-11",
        values: {
          app_name: "Notifications",
          tier: "T3",
          sensitivity: "standard",
          owner_team: "Platform-Msg",
        },
      },
    ],
  },
  {
    id: "/lookups/team_catalog",
    name: "team_catalog",
    source: "user",
    description: "Team directory. Slack handle and on-call rotation per team.",
    lookupField: "owner_team",
    prefix: "team_",
    fields: ["slack_channel", "oncall_rotation", "manager", "cost_center"],
    rows: [
      {
        key: "Platform-SRE-B",
        values: {
          slack_channel: "#sre-b",
          oncall_rotation: "sre-b-primary",
          manager: "alice.lin",
          cost_center: "CC-4101",
        },
      },
      {
        key: "Wealth-Eng",
        values: {
          slack_channel: "#wealth-eng",
          oncall_rotation: "wealth-primary",
          manager: "diego.ortiz",
          cost_center: "CC-2208",
        },
      },
      {
        key: "Platform-Web",
        values: {
          slack_channel: "#platform-web",
          oncall_rotation: "web-primary",
          manager: "mei.tan",
          cost_center: "CC-4102",
        },
      },
      {
        key: "Platform-Msg",
        values: {
          slack_channel: "#platform-msg",
          oncall_rotation: "msg-primary",
          manager: "rafael.s",
          cost_center: "CC-4103",
        },
      },
    ],
  },
  {
    id: "/lookups/cmdb_services",
    name: "cmdb_services",
    source: "user",
    description: "ServiceNow CMDB export, services and dependencies.",
    lookupField: "service_id",
    prefix: "svc_",
    fields: ["criticality", "support_group", "environment"],
    rows: [],
  },
  {
    id: "/system/lookups/http_status_codes",
    name: "http_status_codes",
    source: "system",
    description:
      "Standard HTTP status codes (RFC 9110). Class, phrase and descriptions sourced from MDN.",
    lookupField: "http_status",
    prefix: "http_",
    fields: ["class", "phrase", "description"],
    rows: [
      {
        key: "200",
        values: { class: "2xx", phrase: "OK", description: "200 OK" },
      },
      {
        key: "201",
        values: {
          class: "2xx",
          phrase: "Created",
          description: "201 Created",
        },
      },
      {
        key: "204",
        values: {
          class: "2xx",
          phrase: "No Content",
          description: "204 No Content",
        },
      },
      {
        key: "301",
        values: {
          class: "3xx",
          phrase: "Moved Permanently",
          description: "301 Moved Permanently",
        },
      },
      {
        key: "308",
        values: {
          class: "3xx",
          phrase: "Permanent Redirect",
          description: "308 Permanent Redirect",
        },
      },
      {
        key: "401",
        values: {
          class: "4xx",
          phrase: "Unauthorized",
          description: "401 Unauthorized",
        },
      },
      {
        key: "404",
        values: {
          class: "4xx",
          phrase: "Not Found",
          description: "404 Not Found",
        },
      },
      {
        key: "429",
        values: {
          class: "4xx",
          phrase: "Too Many Requests",
          description: "429 Too Many Requests",
        },
      },
      {
        key: "500",
        values: {
          class: "5xx",
          phrase: "Internal Server Error",
          description: "500 Internal Server Error",
        },
      },
      {
        key: "502",
        values: {
          class: "5xx",
          phrase: "Bad Gateway",
          description: "502 Bad Gateway",
        },
      },
      {
        key: "503",
        values: {
          class: "5xx",
          phrase: "Service Unavailable",
          description: "503 Service Unavailable",
        },
      },
    ],
  },
  {
    id: "/system/lookups/gcp_regions",
    name: "gcp_regions",
    source: "system",
    description: "Google Cloud regions, location and timezone.",
    lookupField: "region",
    prefix: "gcp_",
    fields: ["continent", "country", "city", "timezone"],
    rows: [
      {
        key: "us-east1",
        values: {
          continent: "North America",
          country: "USA",
          city: "Moncks Corner",
          timezone: "America/New_York",
        },
      },
      {
        key: "europe-west3",
        values: {
          continent: "Europe",
          country: "Germany",
          city: "Frankfurt",
          timezone: "Europe/Berlin",
        },
      },
      {
        key: "asia-southeast1",
        values: {
          continent: "Asia",
          country: "Singapore",
          city: "Jurong West",
          timezone: "Asia/Singapore",
        },
      },
    ],
  },
  {
    id: "/system/lookups/aws_regions",
    name: "aws_regions",
    source: "system",
    description: "AWS regions, location and timezone.",
    lookupField: "region",
    prefix: "aws_",
    fields: ["continent", "country", "city", "timezone"],
    rows: [
      {
        key: "us-east-1",
        values: {
          continent: "North America",
          country: "USA",
          city: "Ashburn",
          timezone: "America/New_York",
        },
      },
      {
        key: "eu-central-1",
        values: {
          continent: "Europe",
          country: "Germany",
          city: "Frankfurt",
          timezone: "Europe/Berlin",
        },
      },
      {
        key: "ap-southeast-1",
        values: {
          continent: "Asia",
          country: "Singapore",
          city: "Singapore",
          timezone: "Asia/Singapore",
        },
      },
    ],
  },
  {
    id: "/system/lookups/severity_codes",
    name: "severity_codes",
    source: "system",
    description: "Common severity scales mapped to color and escalation.",
    lookupField: "severity",
    prefix: "sev_",
    fields: ["name", "color", "escalates_to"],
    rows: [
      {
        key: "1",
        values: { name: "Critical", color: "red", escalates_to: "VP" },
      },
      {
        key: "2",
        values: { name: "High", color: "orange", escalates_to: "Director" },
      },
      {
        key: "3",
        values: {
          name: "Medium",
          color: "yellow",
          escalates_to: "Manager",
        },
      },
      {
        key: "4",
        values: { name: "Low", color: "blue", escalates_to: "Team lead" },
      },
    ],
  },
];

export function findMatchingLookups(inScopeFields: string[]): LookupTable[] {
  if (inScopeFields.length === 0) return LOOKUPS;
  const set = new Set(inScopeFields);
  return [...LOOKUPS].sort((a, b) => {
    const aMatch = set.has(a.lookupField) ? 1 : 0;
    const bMatch = set.has(b.lookupField) ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    if (a.source !== b.source) return a.source === "user" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
