# UDG Archi-OS (Automation Preview → Download)

## What this version does
You paste an address and the app automatically:
1) Geocodes the address (Mapbox)
2) Resolves the Durban parcel polygon (eThekwini ArcGIS)
3) Pulls zoning + sewer intersects
4) Computes a first-pass planning envelope (setback + FAR + coverage)
5) Generates a pack (PDF + DXF + GeoJSON + JSON) and lets you **preview before downloading**

## Setup (local)
### 1) Install
```bash
npm install
```

### 2) Set your Mapbox token
Set an environment variable (recommended):
- Windows (PowerShell):
```powershell
$env:MAPBOX_TOKEN="YOUR_TOKEN"
```
- macOS / Linux:
```bash
export MAPBOX_TOKEN="YOUR_TOKEN"
```

### 3) Run the server (automation engine)
```bash
npm run server
```
Server runs on `http://127.0.0.1:5174`.

### 4) Run the UI
In a second terminal:
```bash
npm run dev
```
Open the Vite URL shown in the terminal.

## Usage
- Go to **DATA**
- Paste address → **GENERATE**
- Review **SITE** and **YIELD**
- Click **DOWNLOAD ZIP**
