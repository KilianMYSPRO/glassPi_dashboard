# Walkthrough - GlassPi Monitor Enhancements

I have significantly enhanced the GlassPi Monitor with new features, improved layout, and better user customization.

## Feature History

### 1. Legacy Service Removal (Latest)
- **Action**: Removed Grafana, Prometheus, and Node Exporter.
- **Reason**: Simplified the stack as GlassPi provides sufficient monitoring.
- **Code**: Cleaned up `mockDataService.ts` to remove references.

### 2. Production Deployment
- **Feature**: Added Docker support for easy deployment.
- **Implementation**:
    - Created `Dockerfile` (multi-stage build).
    - Created `docker-compose.yml` (Host Network Mode).
    - Created `nginx.conf` for routing and proxying (Port 3005).

### 3. AI System Analyst Fix
- **Issue**: The AI Analyst was failing to generate reports.
- **Fix**:
    - Corrected API key access in `geminiService.ts` (switched from `process.env` to `import.meta.env`).
    - Added missing `VITE_GEMINI_API_KEY` to `.env`.
    - Added scrollable container for long reports on mobile.

### 4. Collapsible Sections
- **Feature**: Dashboard content is now organized into two collapsible sections: "Active Services" and "System Overview".
- **Implementation**:
    - Created `CollapsibleSection` component.
    - Refactored `App.tsx` to use these sections.
    - Improves mobile usability by allowing users to hide/show large sections.

### 5. Custom Service Sorting
- **Feature**: Users can now reorder service cards via drag-and-drop.
- **Implementation**:
    - Used `@dnd-kit` for drag-and-drop interactions.
    - Persisted sort order in `localStorage`.
    - Updated `ServiceStatus.tsx` to support "Manage Cards" mode with drag handles.

### 6. Uptime Kuma Preview
- **Feature**: A new widget displaying monitors from Uptime Kuma.
- **Implementation**:
    - Created `UptimeKumaWidget.tsx`.
    - Fetches data from Uptime Kuma Status Page API.
    - Added proxy in `vite.config.ts` to avoid CORS.

### 7. Dashboard Layout Restructuring
- **Change**: Reorganized the grid layout for better space utilization.
- **Details**:
    - **AdGuard Home**: Moved to its own 4-column slot (larger size).
    - **Weather Widget**: Moved to top-right.
    - **AI Analyst**: Moved to full-width bottom row.
    - **System Health**: Kept in the middle row.

### 8. Weather Widget
- **Feature**: Visualizes system health as weather conditions (Sunny, Cloudy, Stormy).
- **Details**:
    - Ignores "watchtower" service to prevent false alarms.
    - Displays ignored services in the widget for transparency.
    - Dynamic icon and status text.
    - Immersive CSS animations for Sunny (shine), Rainy (rain drops), and Stormy (lightning) states.

### 9. Mobile Visibility & Security
- **Improvement**: Better card visibility on mobile devices.
- **Optimization**: Reduced padding/gaps and adjusted widget heights for smaller screens.
- **Touch**: Improved drag-and-drop interaction on touch devices.
- **Layout**: Fixed overlapping cards and overflowing text by implementing responsive heights and text truncation.
- **Security**: Moved sensitive credentials (AdGuard) to `.env` file.

## Technical Details

### Dependencies Added
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

#### 11. Glances Data Robustness
- **Issue**: Race condition in API version detection caused initial data fetch failures.
- **Fix**: Implemented singleton pattern for version detection to ensure only one detection request runs at a time.
- **Result**: Reliable data loading on the first refresh.

### 12. Bug Fixes
- **CPU Data**: Fixed parsing logic to correctly handle `0` values from Glances API.
- **Charts**: Fixed Recharts height error by enforcing minimum height on container.
- **Performance**: Removed unnecessary Tailwind CDN script from production build.
- **Styles**: Restored Tailwind CSS by installing dependencies (`tailwindcss@3`, `autoprefixer`), configuring PostCSS, and adding directives to `index.css`.
- **Configuration**: Updated service URL mapping to correctly point DuoGym to `http://duogym.home`.

## Known Issues Modified
- `App.tsx`: Main layout, state management, and section organization.
- `components/CollapsibleSection.tsx`: New reusable component.
- `components/ServiceStatus.tsx`: Drag-and-drop implementation.
- `components/AdGuardWidget.tsx`: Layout and styling adjustments.
- `services/mockDataService.ts`: Data fetching logic (Kuma, Docker).
- `services/geminiService.ts`: AI analysis logic (fixed API key access).
- `vite.config.ts`: Proxy configuration.
- `Dockerfile`, `docker-compose.yml`, `nginx.conf`: Deployment configuration.

## Deployment

### Using Docker Compose (Recommended)
1. Ensure you have a `.env` file with your credentials (see `.env.example`).
2. Run:
   ```bash
   docker compose up -d --build
   ```
3. Access the dashboard at `http://raspberrypi:3005` (or `http://localhost:3005`).

### Manual Build
1. Install dependencies: `npm install`
2. Build the app: `npm run build`
3. Serve the `dist` folder using any static file server.

## Verification
- **Build**: Verified `npm run build` completes successfully.
- **AI Analyst**: Verified API key configuration and code fix.
- **Sorting**: Verified drag-and-drop works and persists after refresh.
- **Sections**: Verified expanding/collapsing sections works.
- **Data**: Verified all widgets fetch and display data correctly.
- **Layout**: Verified responsive layout on desktop and mobile.

## Repository
- **URL**: `https://github.com/KilianMYSPRO/glassPi_dashboard.git`
- **Branch**: `main`
