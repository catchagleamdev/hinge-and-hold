#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.HINGE_AND_HOLD_API_KEY;
const BASE_URL =
  "https://uaopsljhipcbpkvyfluv.supabase.co/functions/v1/shots-api";

if (!API_KEY) {
  console.error(
    "Missing required environment variable: HINGE_AND_HOLD_API_KEY"
  );
  process.exit(1);
}

async function apiFetch(path) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "x-api-key": API_KEY },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

const server = new McpServer({
  name: "hinge-and-hold",
  version: "1.0.0",
});

server.tool(
  "get_sessions",
  "Fetch all Hinge & Hold practice sessions, ordered newest first. Returns id, session_date, session_type (chipping or putting), created_at, notes, and count (shots or putts logged). Optionally filter by type.",
  {
    type: z
      .enum(["chipping", "putting"])
      .optional()
      .describe("Filter by session type: chipping or putting"),
  },
  async ({ type }) => {
    const path = type ? `/?type=${type}` : "/";
    const data = await apiFetch(path);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "get_session_detail",
  "Fetch a single practice session by ID with its complete shots or putts array. Chipping sessions include contact, miss_direction, proximity, lie_surface, lie_slope, ball_position, club, notes per shot. Putting sessions include result, miss_direction, putt_length, green_speed, slope, break, notes per putt.",
  {
    session_id: z.string().describe("The UUID of the session to fetch"),
  },
  async ({ session_id }) => {
    const data = await apiFetch(`/${session_id}`);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "get_recent_sessions",
  "Fetch the most recent N practice sessions across both chipping and putting, ordered newest first.",
  {
    n: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Number of recent sessions to return (default 5)"),
  },
  async ({ n = 5 }) => {
    const data = await apiFetch(`/?recent=${n}`);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "get_stats",
  "Fetch aggregate stats across all Hinge & Hold sessions. Chipping: total shots, contact breakdown (Fat/Pure/Thin count + %), miss direction breakdown, proximity breakdown, holed out count. Putting: total putts, overall make %, make % by putt length, miss direction breakdown (missed putts only).",
  {},
  async () => {
    const data = await apiFetch("/stats");
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
