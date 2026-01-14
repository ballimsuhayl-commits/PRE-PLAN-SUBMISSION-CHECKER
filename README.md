# UDG Pre-Plan Submission Checker (Complete Wired Stack)

## What is wired and working
- UI (Vite + React + TS) calls backend via /api/process_address
- Backend geocodes address:
  - Mapbox if MAPBOX_TOKEN is provided (optional)
  - Otherwise FREE OSM Nominatim fallback
- Backend calls eThekwini public ArcGIS services:
  - Parcel polygon + attributes
  - Zoning intersect
  - Sewer intersect
- UI shows a preview and raw JSON for verification

## Run (2 terminals)

### Terminal 1
npm install
npm run server

### Terminal 2
npm run dev

Open http://localhost:5173

## Optional Mapbox (faster/better geocode)
Create a file called .env in the project root:
MAPBOX_TOKEN=YOUR_TOKEN
PORT=5174
