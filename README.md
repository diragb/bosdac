# BOSDAC - Better MOSDAC

**BOSDAC** (Better MOSDAC) is a modern, user-friendly web application that provides an enhanced interface for viewing live satellite imagery and meteorological data from ISRO's MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre).

## Why BOSDAC?

MOSDAC is ISRO's official website for viewing live satellite images of Earth sourced from INSAT-3x satellites. However, the original MOSDAC interface suffers from terrible UI/UX design. BOSDAC addresses this by providing:

- **Modern, intuitive interface** with better user experience
- **All original MOSDAC features** including satellite imagery, weather data, and forecasts
- **Enhanced functionality** like timelapse animations and improved data visualization
- **Better performance** with intelligent caching and optimized data loading

## Features

### Core Satellite Data
- **Live Satellite Imagery** - Real-time Earth observation from INSAT-3x satellites
- **Historical Data Access** - Browse through past satellite images with timestamps
- **Multiple Visualization Modes** - Greyscale, Rainbow, SST, Ferret, NHC color schemes

### Weather & Environmental Layers
- **Wind Direction & Heatmap** - Real-time wind patterns and velocity visualization
- **Fire & Smoke Detection** - Active fire points and smoke dispersion tracking
- **Heavy Rain & Cloudburst** - Precipitation monitoring and forecasting
- **Snow Cover** - Snow extent mapping and monitoring
- **Rip Current Forecasts** - Coastal safety information

### Advanced Features
- **Timelapse Animation** - Create animated sequences of satellite imagery with customizable speed controls
- **Interactive Map** - Pan, zoom, and explore with Leaflet-based mapping
- **Layer Management** - Toggle multiple data layers simultaneously
- **Opacity Controls** - Adjust transparency for better data overlay visualization
- **Intelligent Caching** - Local storage optimization for faster loading

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Mapping**: Leaflet with React-Leaflet
- **UI Components**: Radix UI with Tailwind CSS
- **Data Visualization**: Custom wind vectors, heatmaps, and overlays
- **Caching**: LocalForage for client-side data persistence

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/diragb/bosdac.git
cd bosdac
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Basic Navigation
- **Map Interaction**: Pan and zoom using mouse/touch controls
- **Layer Selection**: Use the "Layers" dropdown to add weather and environmental data
- **Historical Data**: Select specific timestamps from the "History" dropdown
- **Animation**: Use the animation controls to create timelapse sequences

### Available Layers
- **Wind Direction**: Real-time wind vector visualization
- **Wind Heatmap**: Wind intensity heatmap overlay
- **Fire & Smoke**: Active fire detection points
- **Fire & Smoke Heatmap**: Fire intensity visualization
- **Heavy Rain**: Current precipitation data
- **Heavy Rain Forecast**: Precipitation predictions
- **Cloudburst Forecast**: Severe weather warnings
- **Rip Current Forecast**: Coastal hazard information
- **Snow**: Snow cover extent mapping

### Animation Controls
- **Play/Pause**: Control timelapse playback
- **Speed Selection**: Choose from 3m/s to 1h/s animation speeds
- **Range Selection**: Define start and end points for animations
- **Repeat Mode**: Loop animations continuously

## Data Sources

BOSDAC relies on MOSDAC's APIs and services:
- **Satellite Imagery**: INSAT-3x satellite data via MOSDAC WMS services
- **Weather Data**: Real-time meteorological data from ISRO
- **Forecast Data**: Weather predictions and alerts

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## Acknowledgments

- **ISRO** for providing satellite data through MOSDAC.
- **MOSDAC** for the original data services and APIs.
- **OpenStreetMap** contributors for base map tiles.
- **Leaflet** community for mapping capabilities.
