# Walkthrough - Mobile Visibility & Security Improvements

I have improved the dashboard's visibility on mobile devices and secured the AdGuard credentials to prepare the project for public sharing.

## Changes

### Mobile Visibility

#### [index.css](file:///home/kikozaurus/glasspi/index.css)
- Added a media query for screens smaller than `768px`.
- Increased the opacity of `.glass-panel` on mobile to make text more readable against the background.
- Added a stronger border to cards on mobile for better separation.

### Security

#### [services/mockDataService.ts](file:///home/kikozaurus/glasspi/services/mockDataService.ts)
- Removed hardcoded AdGuard credentials.
- Updated configuration to read from `import.meta.env.VITE_ADGUARD_USERNAME` and `VITE_ADGUARD_PASSWORD`.
- Added `/// <reference types="vite/client" />` to fix TypeScript errors.

#### [.env](file:///home/kikozaurus/glasspi/.env)
- Created a local `.env` file containing your actual credentials.
- **Note:** This file is ignored by git and will not be pushed.

#### [.env.example](file:///home/kikozaurus/glasspi/.env.example)
- Created an example file with empty values for the public repository.

#### [.gitignore](file:///home/kikozaurus/glasspi/.gitignore)
- Explicitly added `.env` and `.env.*` to the ignore list (while keeping `.env.example`).

## Verification Results

### Automated Tests
- `npm run dev` was running throughout the process.

### Manual Verification
- **Mobile Visibility:** Verified by user.
- **Security:**
    - Credentials are no longer in the source code.
    - `.env` file is created and populated.
    - `.gitignore` is updated.
