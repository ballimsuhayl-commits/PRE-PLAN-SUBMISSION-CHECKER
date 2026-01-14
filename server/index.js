import express from "express";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

const PORT = process.env.PORT ? Number(process.env.PORT) : 5174;

const API_URLS = {
  PARCELS:
    "https://gis.durban.gov.za/arcgis/rest/services/Public/Property_Query/MapServer/0/query",
  ZONING:
    "https://gis.durban.gov.za/arcgis/rest/services/Public/Land_Use_Management/MapServer/0/query",
  SEWER:
    "https://gis.durban.gov.za/arcgis/rest/services/Public/Water_Sanitation/MapServer/1/query",
};

function withTimeout(ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
}

async function safeFetchJson(url, options = {}, timeoutMs = 15000) {
  const { signal, done } = withTimeout(timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(
        `Non-JSON response from ${url}. Status ${res.status}. Body starts: ${text.slice(0, 200)}`
      );
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url}. Body starts: ${text.slice(0, 200)}`);
    }
    return json;
  } finally {
    done();
  }
}

async function geocodeNominatim(address) {
  const q = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
  const json = await safeFetchJson(
    url,
    { headers: { "User-Agent": "UDG-PrePlan-Checker/1.0 (local-dev)" } },
    15000
  );

  if (!Array.isArray(json) || json.length === 0) {
    throw new Error("Geocode failed: no results from Nominatim.");
  }
  const hit = json[0];
  return { lat: Number(hit.lat), lon: Number(hit.lon), display_name: hit.display_name };
}

async function geocodeMapbox(address) {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return null;
  const q = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?limit=1&access_token=${token}`;
  const json = await safeFetchJson(url, {}, 15000);
  const f = json?.features?.[0];
  if (!f?.center?.length) return null;
  return { lat: Number(f.center[1]), lon: Number(f.center[0]), display_name: f.place_name };
}

async function fetchParcelByPoint(lon, lat) {
  const params = new URLSearchParams({
    f: "json",
    where: "1=1",
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "1",
  });

  const url = `${API_URLS.PARCELS}?${params.toString()}`;
  const json = await safeFetchJson(url, {}, 20000);
  const feat = json?.features?.[0];
  if (!feat) throw new Error("No parcel found at this location (Durban GIS returned no features).");
  return feat;
}

async function queryIntersectsPolygon(serviceUrl, polygonGeometry) {
  const params = new URLSearchParams({
    f: "json",
    geometry: JSON.stringify(polygonGeometry),
    geometryType: "esriGeometryPolygon",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "false",
  });
  const url = `${serviceUrl}?${params.toString()}`;
  return await safeFetchJson(url, {}, 20000);
}

app.get("/health", (req, res) => res.json({ ok: true, port: PORT }));

app.post("/api/process_address", async (req, res) => {
  try {
    const address = req.body?.address?.trim();
    if (!address) return res.status(400).json({ error: "missing_address" });

    const geo = (await geocodeMapbox(address)) ?? (await geocodeNominatim(address));

    const parcel = await fetchParcelByPoint(geo.lon, geo.lat);
    const rings = parcel?.geometry?.rings;
    if (!rings) throw new Error("Parcel geometry missing rings (unexpected).");

    const zoningRes = await queryIntersectsPolygon(API_URLS.ZONING, parcel.geometry);
    const sewerRes = await queryIntersectsPolygon(API_URLS.SEWER, parcel.geometry);

    const zoning =
      zoningRes?.features?.[0]?.attributes?.ZONING_CODE ??
      zoningRes?.features?.[0]?.attributes?.ZONING ??
      "UNKNOWN";

    const sewer = (sewerRes?.features ?? []).map((f) => ({
      diameter: f?.attributes?.DIAMETER ?? null,
      type: f?.attributes?.ASSETTYPE ?? null,
      raw: f?.attributes ?? {},
    }));

    const attrs = parcel.attributes ?? {};
    const erf = attrs.ERF_NUMBER ?? attrs.ERF ?? attrs.ERFNO ?? attrs.ERFNUM ?? "UNKNOWN";
    const area = attrs.SHAPE_Area ?? attrs.AREA ?? 0;
    const street = attrs.STREET_ADDRESS ?? attrs.ADDRESS ?? geo.display_name ?? "Unknown";

    return res.json({
      ok: true,
      input_address: address,
      geocode: geo,
      parcel: { erf, area, address: street, attributes: attrs, rings },
      zoning: { code: zoning, raw: zoningRes?.features?.[0]?.attributes ?? null },
      sewer: { count: sewer.length, features: sewer },
    });
  } catch (err) {
    console.error("❌ /api/process_address failed:", err);
    return res.status(500).json({
      error: "process_address_failed",
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`UDG automation server running on http://127.0.0.1:${PORT}`);
});
