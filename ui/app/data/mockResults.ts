export type BaseLogRow = {
  timestamp: string;
  event_type: string;
  app_id: string;
  http_status: string;
  owner_team: string;
  region: string;
  severity: string;
};

export const MOCK_BASE_ROWS: BaseLogRow[] = [
  {
    timestamp: "Apr 28, 18:40:57.627",
    event_type: "admin-action",
    app_id: "FA-01",
    http_status: "200",
    owner_team: "Platform-SRE-B",
    region: "us-east-1",
    severity: "3",
  },
  {
    timestamp: "Apr 28, 18:40:57.728",
    event_type: "infra.health",
    app_id: "FA-01",
    http_status: "200",
    owner_team: "Platform-SRE-B",
    region: "us-east-1",
    severity: "4",
  },
  {
    timestamp: "Apr 28, 18:40:57.729",
    event_type: "app.request",
    app_id: "PM-02",
    http_status: "201",
    owner_team: "Wealth-Eng",
    region: "us-east-1",
    severity: "4",
  },
  {
    timestamp: "Apr 28, 18:40:57.729",
    event_type: "app.request",
    app_id: "WP-04",
    http_status: "200",
    owner_team: "Platform-Web",
    region: "eu-central-1",
    severity: "4",
  },
  {
    timestamp: "Apr 28, 18:40:57.730",
    event_type: "app.request",
    app_id: "WP-04",
    http_status: "404",
    owner_team: "Platform-Web",
    region: "eu-central-1",
    severity: "3",
  },
  {
    timestamp: "Apr 28, 18:40:57.730",
    event_type: "app.request",
    app_id: "WP-04",
    http_status: "429",
    owner_team: "Platform-Web",
    region: "eu-central-1",
    severity: "2",
  },
  {
    timestamp: "Apr 28, 18:40:57.730",
    event_type: "app.request",
    app_id: "NOT-11",
    http_status: "204",
    owner_team: "Platform-Msg",
    region: "ap-southeast-1",
    severity: "4",
  },
  {
    timestamp: "Apr 28, 18:40:57.731",
    event_type: "app.request",
    app_id: "FA-01",
    http_status: "500",
    owner_team: "Platform-SRE-B",
    region: "us-east-1",
    severity: "1",
  },
  {
    timestamp: "Apr 28, 18:40:57.731",
    event_type: "app.request",
    app_id: "PM-02",
    http_status: "503",
    owner_team: "Wealth-Eng",
    region: "us-east-1",
    severity: "1",
  },
  {
    timestamp: "Apr 28, 18:40:57.732",
    event_type: "app.request",
    app_id: "WP-04",
    http_status: "200",
    owner_team: "Platform-Web",
    region: "eu-central-1",
    severity: "4",
  },
];
