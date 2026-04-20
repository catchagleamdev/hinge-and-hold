import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-api-key, content-type",
};

const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: JSON_HEADERS,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  // --- Auth via API key ---
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return errorResponse("Missing x-api-key header", 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("api_key", apiKey)
    .single();

  if (profileError || !profile) {
    return errorResponse("Invalid API key", 401);
  }

  const userId = profile.id;

  // --- Routing ---
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "";
  const sessionId = UUID_RE.test(lastSegment) ? lastSegment : null;
  const isStats = lastSegment === "stats";

  // --- GET /:session_id ---
  if (sessionId) {
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session) {
      return errorResponse("Not found", 404);
    }

    if (session.session_type === "putting") {
      const { data: putts } = await supabase
        .from("putts")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      return jsonResponse({ session, putts: putts ?? [] });
    } else {
      const { data: shots } = await supabase
        .from("shots")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      return jsonResponse({ session, shots: shots ?? [] });
    }
  }

  // --- GET /stats ---
  if (isStats) {
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, session_type")
      .eq("user_id", userId);

    const allSessions = sessions ?? [];
    const chippingIds = allSessions
      .filter((s) => s.session_type === "chipping")
      .map((s) => s.id);
    const puttingIds = allSessions
      .filter((s) => s.session_type === "putting")
      .map((s) => s.id);

    let chippingStats = null;
    if (chippingIds.length > 0) {
      const { data: shots } = await supabase
        .from("shots")
        .select("contact, miss_direction, proximity")
        .in("session_id", chippingIds);

      const shotList = shots ?? [];
      const total = shotList.length;
      const contactCounts = { Fat: 0, Pure: 0, Thin: 0 };
      const missCounts: Record<string, number> = {};
      const proximityCounts: Record<string, number> = {};
      let holedOut = 0;

      shotList.forEach((s) => {
        if (s.contact) {
          s.contact.forEach((c: string) => {
            if (c in contactCounts)
              contactCounts[c as keyof typeof contactCounts]++;
          });
        }
        if (s.miss_direction) {
          s.miss_direction.forEach((m: string) => {
            missCounts[m] = (missCounts[m] || 0) + 1;
          });
        }
        if (s.proximity) {
          proximityCounts[s.proximity] =
            (proximityCounts[s.proximity] || 0) + 1;
          if (s.proximity === "Holed Out \uD83C\uDFC6") holedOut++;
        }
      });

      chippingStats = {
        sessions: chippingIds.length,
        total_shots: total,
        contact: {
          Fat: {
            count: contactCounts.Fat,
            pct: total > 0 ? Math.round((contactCounts.Fat / total) * 100) : 0,
          },
          Pure: {
            count: contactCounts.Pure,
            pct:
              total > 0 ? Math.round((contactCounts.Pure / total) * 100) : 0,
          },
          Thin: {
            count: contactCounts.Thin,
            pct:
              total > 0 ? Math.round((contactCounts.Thin / total) * 100) : 0,
          },
        },
        miss_direction: missCounts,
        proximity: proximityCounts,
        holed_out: holedOut,
      };
    }

    let puttingStats = null;
    if (puttingIds.length > 0) {
      const { data: putts } = await supabase
        .from("putts")
        .select("result, miss_direction, putt_length")
        .in("session_id", puttingIds);

      const puttList = putts ?? [];
      const total = puttList.length;
      const made = puttList.filter((p) => p.result === "Made \uD83C\uDFAF").length;
      const missedPutts = puttList.filter((p) => p.result === "Missed");

      const makeByLength: Record<
        string,
        { made: number; total: number; pct: number }
      > = {};
      puttList.forEach((p) => {
        if (!p.putt_length) return;
        if (!makeByLength[p.putt_length])
          makeByLength[p.putt_length] = { made: 0, total: 0, pct: 0 };
        makeByLength[p.putt_length].total++;
        if (p.result === "Made \uD83C\uDFAF") makeByLength[p.putt_length].made++;
      });
      Object.values(makeByLength).forEach((v) => {
        v.pct = v.total > 0 ? Math.round((v.made / v.total) * 100) : 0;
      });

      const missCounts: Record<string, number> = {};
      missedPutts.forEach((p) => {
        if (p.miss_direction) {
          p.miss_direction.forEach((m: string) => {
            missCounts[m] = (missCounts[m] || 0) + 1;
          });
        }
      });

      puttingStats = {
        sessions: puttingIds.length,
        total_putts: total,
        overall_make_pct:
          total > 0 ? Math.round((made / total) * 100) : 0,
        make_by_length: makeByLength,
        miss_direction: missCounts,
      };
    }

    return jsonResponse({ chipping: chippingStats, putting: puttingStats });
  }

  // --- GET / --- sessions list with optional filters + counts
  const typeFilter = url.searchParams.get("type");
  const recentParam = url.searchParams.get("recent");
  const recentN = recentParam ? parseInt(recentParam, 10) : null;

  let query = supabase
    .from("sessions")
    .select("id, session_date, session_type, created_at, notes")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (typeFilter) {
    query = query.eq("session_type", typeFilter);
  }

  if (recentN && recentN > 0) {
    query = query.limit(recentN);
  }

  const { data: sessionRows, error: sessionsError } = await query;

  if (sessionsError) {
    return errorResponse("Failed to fetch sessions", 500);
  }

  const sessionList = sessionRows ?? [];

  const chippingIds = sessionList
    .filter((s) => s.session_type === "chipping")
    .map((s) => s.id);
  const puttingIds = sessionList
    .filter((s) => s.session_type === "putting")
    .map((s) => s.id);

  const countMap: Record<string, number> = {};

  if (chippingIds.length > 0) {
    const { data: shotRows } = await supabase
      .from("shots")
      .select("session_id")
      .in("session_id", chippingIds);
    (shotRows ?? []).forEach((r: { session_id: string }) => {
      countMap[r.session_id] = (countMap[r.session_id] || 0) + 1;
    });
  }

  if (puttingIds.length > 0) {
    const { data: puttRows } = await supabase
      .from("putts")
      .select("session_id")
      .in("session_id", puttingIds);
    (puttRows ?? []).forEach((r: { session_id: string }) => {
      countMap[r.session_id] = (countMap[r.session_id] || 0) + 1;
    });
  }

  const result = sessionList.map((s) => ({
    ...s,
    count: countMap[s.id] ?? 0,
  }));

  return jsonResponse(result);
});
