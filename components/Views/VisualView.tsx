
import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { PackPreview } from '../../types';

type LayerState = Record<string, boolean>;

export const VisualView: React.FC<{ preview: PackPreview | null; activeConstraint?: string | null }> = ({ preview, activeConstraint }) => {
  const mapDiv = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerState>({});

  const token = (import.meta as any).env?.VITE_MAPBOX_TOKEN as string | undefined;

  const siteGeoJSON = useMemo(() => {
    const ring = preview?.property?.rings?.[0];
    if (!ring?.length) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: preview!.property.rings },
    } as GeoJSON.Feature;
  }, [preview]);

  const availableConstraints = useMemo(() => {
    const cs = preview?.constraints || [];
    return cs.filter(c => (c.featureCount || 0) > 0);
  }, [preview]);

  useEffect(() => {
    if (!mapDiv.current) return;
    if (!preview || !siteGeoJSON) return;

    if (!token || token.includes('PASTE')) {
      setErr('Mapbox token missing. Set VITE_MAPBOX_TOKEN in a .env file to enable the live map.');
      return;
    }

    setErr(null);
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapDiv.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: siteGeoJSON.geometry.type === 'Polygon' ? (siteGeoJSON.geometry.coordinates[0][0] as any) : [31.0218, -29.8587],
      zoom: 14,
      pitch: 60,
      bearing: -15,
      antialias: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Terrain
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Site
      map.addSource('site', { type: 'geojson', data: siteGeoJSON as any });

      map.addLayer({
        id: 'site-fill',
        type: 'fill',
        source: 'site',
        paint: { 'fill-opacity': 0.25 },
      });

      map.addLayer({
        id: 'site-line',
        type: 'line',
        source: 'site',
        paint: { 'line-width': 2 },
      });

      // Fit bounds
      const coords = (siteGeoJSON.geometry as any).coordinates?.[0] || [];
      const bounds = coords.reduce((b: mapboxgl.LngLatBounds, c: any) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(bounds, { padding: 80, duration: 0 });

      // Initialize layer state
      const init: LayerState = {};
      for (const c of availableConstraints) init[c.key] = false;
      setLayers(init);
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, [preview?.jobId, token]); // re-init map per job

  async function ensureConstraintLayer(key: string, enabled: boolean) {
    const map = mapRef.current;
    if (!map || !preview?.jobId) return;

    const srcId = `c_${key}`;
    const fillId = `c_${key}_fill`;
    const lineId = `c_${key}_line`;

    if (!enabled) {
      if (map.getLayer(fillId)) map.removeLayer(fillId);
      if (map.getLayer(lineId)) map.removeLayer(lineId);
      if (map.getSource(srcId)) map.removeSource(srcId);
      return;
    }

    // Fetch GeoJSON on demand
    const res = await fetch(`/api/constraint/${preview.jobId}/${key}`);
    if (!res.ok) throw new Error(await res.text().catch(() => 'Constraint fetch failed'));
    const geojson = await res.json();

    if (!map.getSource(srcId)) {
      map.addSource(srcId, { type: 'geojson', data: geojson });
    } else {
      (map.getSource(srcId) as any).setData(geojson);
    }

    // Heuristic styling based on geometry types
    map.addLayer({
      id: lineId,
      type: 'line',
      source: srcId,
      filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'MultiLineString']],
      paint: { 'line-width': 2 },
    });

    map.addLayer({
      id: fillId,
      type: 'fill',
      source: srcId,
      filter: ['any', ['==', '$type', 'Polygon'], ['==', '$type', 'MultiPolygon']],
      paint: { 'fill-opacity': 0.18 },
    });
  }

  useEffect(() => {
    // When user clicks "Show on Map" in Data tab, auto-enable that constraint here.
    if (!activeConstraint) return;
    if (!availableConstraints.some(c => c.key === activeConstraint)) return;

    setLayers(prev => ({ ...prev, [activeConstraint]: true }));
    ensureConstraintLayer(activeConstraint, true).catch(() => null);
  }, [activeConstraint, preview?.jobId]);

  if (!preview) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-400 uppercase">3D Site</div>
          <div className="text-lg font-bold text-white truncate">
            {preview.property.resolvedAddress || preview.property.addressInput}
          </div>
          <div className="text-[11px] text-slate-400">
            Live CMV-backed layers + terrain. Use the toggles to overlay constraints.
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-[12px] text-red-200">
          {err}
          <div className="text-[11px] text-red-300 mt-1">
            Create a file named <span className="font-mono">.env</span> in the project root with: <span className="font-mono">VITE_MAPBOX_TOKEN=YOUR_TOKEN</span>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-3">
          <div className="text-[10px] text-slate-500 uppercase">Overlay Layers</div>

          {availableConstraints.length ? (
            <div className="space-y-2">
              {availableConstraints.map(c => (
                <label key={c.key} className="flex items-center justify-between gap-3 rounded bg-slate-950/60 border border-slate-800 p-2">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-white truncate">{c.label}</div>
                    <div className="text-[11px] text-slate-400 truncate">{c.featureCount} feature(s)</div>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-500"
                    checked={!!layers[c.key]}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setLayers(prev => ({ ...prev, [c.key]: on }));
                      ensureConstraintLayer(c.key, on).catch((ex) => setErr(String(ex?.message || ex)));
                    }}
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-slate-400">No constraint layers detected for this parcel.</div>
          )}

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Tip: Use the SG panel in the Data tab to fetch the official Surveyor-General diagram, then include it in the download pack.
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900">
          <div ref={mapDiv} className="w-full h-[520px]" />
        </div>
      </div>
    </div>
  );
};
