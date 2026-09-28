# Whoof real-phone preview

Standalone snapshot of design_v1, 24 September 2026. No simulated phone frame.

Mac: http://localhost:4178/
Current Wi-Fi: http://192.168.1.179:4178/
Original simulator: http://localhost:4177/

Run: npm run dev -- --host 0.0.0.0 --port 4178 --strictPort
Mac must remain awake and connected to the same network.

NativeProvider uses browser keyboard, scrolling, VisualViewport and safe areas. Verified at 360, 390 and 430 px: navigation, sheets, walk recording, invite acceptance and AI input. Build and original runtime integrity checks passed.

Separate snapshot: future changes on 4177 do not automatically propagate. Browser state and local documents are separate due to the different origin. No backend or cross-device synchronization.
