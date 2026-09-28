# Mobile Prototype Agent Guide

## Prototype Instructions

In ChatGPT Work Mode, run `sites-preview start "$PWD"`, open `http://terminal.local:4173/` in the cloud browser, and verify the rendered app and its primary interactions. Keep that preview open and tell the user to inspect it in the cloud browser; do not present the local URL as a user-facing chat link. In Codex Desktop, run the local server yourself, open the preview in the in-app browser, and provide the clickable local URL. Do not deploy to Sites unless the user explicitly asks to share, publish, or deploy. Do not give the user server-start instructions when you can run it.

Before planning or implementing any mobile-app change, read this `AGENTS.md` in full. It is the source of truth for the template's runtime and component guidance.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Editing Boundary

- Build app-specific UI in `src/Prototype.tsx` and `src/prototype.css`.
- Treat `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs` as protected runtime files. Do not edit, replace, remove, or recreate them unless the user explicitly asks to change the mobile runtime itself. For an explicit runtime change, update the affected lock hashes only after verifying the new runtime behavior.
- Run `npm run check:runtime` before preview or handoff. If it fails, restore the protected runtime instead of weakening or bypassing the check.
- `npm run build` preserves the mobile runtime and prepares the static Cloudflare Worker output required by Sites. Before a Sites handoff, confirm `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and source `.openai/hosting.json` exist, then run `npm run test:sites`. Do not replace this project with a Vinext starter.

## Runtime Contract

- Preserve the mobile device runtime unless the user's task explicitly asks otherwise. Do not replace it with a standalone page. Visual fidelity applies to app-owned content inside the device screen, not to template-owned device chrome.
- Keep `App` composed around `PhoneFrame` -> `KeyboardProvider`, with `StatusBar`, app content, `HomeIndicator`, and `KeyboardDock` mounted inside the phone frame. `StatusBar` and the iOS home indicator are overlaid device chrome. When the Android keyboard is closed, the app viewport reserves the protected navigation-bar region instead of painting behind it. When the Android keyboard is open, preserve the current full-screen keyboard layout: its asset includes the IME navigation strip and the separate black navigation bar is hidden. iOS screens continue to paint behind the home-indicator area and own their safe-area content padding.
- Preserve the `iPhone` / `Pixel 10` device picker and both calibrated device presets. The Pixel screen is `427 x 952`; its `32 x 32` camera circle and `public/assets/android/navigation-bar.svg` bottom navigation bar are protected device chrome, not app content.
- Preserve the device picker's intentionally lightweight Codex styling in the top-right corner: its trigger wrapper is borderless and transparent, its trigger sizes to content, and its right-aligned menu uses the compact 3px inset plus the specified hairline and elevation shadow layers. Keep the prototype root and default app screen white.
- Preserve `StatusBar` as live device chrome, including its platform-specific typography, source status-icon assets, and spacing. Pixel 10 uses Roboto, Android indicators, and 32px top, left, and right padding. iPhone uses its iOS indicators, system typography, and calibrated spacing. Do not hardcode screenshot times like `9:41` into the status bar, replace its real-time clock, or move status bar content into app markup unless the user explicitly asks for a fixed/mock device time.
- `PhoneFrame` owns the calibrated device frame, screen portal, device picker, camera cutout, and custom cursor. Keep device assets in `public/assets/iphone/` and `public/assets/android/`; if an asset fails to load, repair the asset path or restore the asset instead of removing the frame, keyboard, or image render.
- Use `MobileScroll` directly for simple single-screen prototypes. Use `FlowStack` for conventional multi-screen flows whose routes can own their fixed header and footer; when using it, define each route as a `FlowScreen`: `{ id, header?, headerHeight?, footer?, footerHeight?, render }`, and use `flow.push(screen)`, `flow.pop()`, and `flow.replace(screen)` from `FlowStack` render callbacks or `useFlow()` instead of introducing another router.
- Use `Carousel` for a carousel, horizontal rail, swipeable cards, image or media strip, horizontally scrollable cards, chip rail, or other horizontal collection.
- For a layered app shell—such as a persistent composer, independently presented sheet, pushed/peek sidebar, or app-wide transition—compose directly in `Prototype.tsx` rather than forcing it through `FlowStack`. Keep app-owned fixed chrome as sibling layers outside `MobileScroll`.
- When using `FlowScreen`, put route-owned fixed headers or footers in `FlowScreen.header` or `FlowScreen.footer`. Set `headerHeight` to the visible app-toolbar height; `FlowStack` adds the device's top safe-area/status-bar inset automatically. Do not include `StatusBar` or its height in the header. Set `footerHeight` to the full app-footer height. `FlowScreen.footer` is an overlay, not reserved layout space; screens using it must add their own bottom content padding such as `padding-bottom: calc(var(--flow-footer-height) + var(--mobile-safe-area-height) + 24px)` so final content can scroll above the footer while still painting behind it.
- Render only scrollable content inside `MobileScroll`; it is for content that should move with scroll and rubber-band overscroll. Keep app-owned headers, nav bars, tabs, composers, and overlays outside it. This keeps scroll physics, safe areas, keyboard insets, scrollbars, and drag click suppression active without letting content paint under fixed chrome.
- Buttons, links, cards, and images inside `MobileScroll` should still allow drag scrolling when the pointer moves beyond tap slop. Use `data-scroll-drag="ignore"` only for rare controls that must own the drag gesture themselves.
- Do not add `var(--keyboard-height)` to ordinary screen/content padding inside `MobileScroll`; the scroll viewport already shrinks above the simulated keyboard. For custom fixed composers, search bars, or toast chrome, use `useKeyboardInsets().bottomInset`. It is relative to the app viewport: Android returns `0` while the closed-keyboard viewport already reserves navigation, then returns the keyboard height while open; iOS continues to clear the home indicator while closed and ride directly above the keyboard while open. Do not pin custom bottom chrome to `bottom: 0` or only `keyboardHeight`.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for every text-entry control. A raw `input` or `textarea` disconnects focus, keyboard animation, safe-area insets, and attached surfaces.
- Use `BottomSheet` for phone-scoped sheets. Its props are `open`, `onOpenChange`, `title`, optional `description`, optional `snap`, and `children`; it renders through the phone screen portal and dismisses the keyboard before opening.

## Horizontal Carousels

- Use `Carousel` for horizontally draggable cards, images, media, chips, or other horizontal collections. Do not recreate these with `overflow-x`, custom pointer handlers, or a generic div.
- `Carousel` can be nested directly inside `MobileScroll`. It owns horizontal gestures and automatically yields vertical gestures to the parent.
- Never put `data-scroll-drag="ignore"` on or around a `Carousel`; doing so prevents vertical parent scrolling when a gesture begins inside it.
- Do not add CSS scroll snapping to `Carousel`; its runtime owns momentum and release motion.
- Use `data-scroll-drag="ignore"` only when a control must prevent parent scrolling in every drag direction.

See `src/mobile/COMPONENTS.md` for the full component and gesture contract.

## Keyboard Rule

The simulated keyboard is a separate top-layer component. Before presenting anything that behaves like iOS navigation or modal UI, dismiss it first.

Call `keyboard.hide()` before:

- pushing, popping, or replacing FlowStack routes
- opening bottom sheets, action sheets, dialogs, menus, or navigation sheets
- starting transitions where the destination should not inherit text-input focus

`FlowStack` already hides the keyboard for `push`, `pop`, and `replace`. `BottomSheet` already hides it before opening. If you add new modal/sheet/navigation primitives, follow the same rule.

When a composer, search surface, or other keyboard-attached component closes, call `keyboard.hide()` in the same event before changing that component's open state. Position attached surfaces from `useKeyboardInsets()` rather than a separate timer or visibility flag so both dismiss together.

When any text-entry control loses focus, dismiss the simulated keyboard. If the control is custom or does not use the runtime's keyboard-aware fields, handle its blur event and call `keyboard.hide()` explicitly. Keep the keyboard open only when focus is moving directly to another text-entry control that should share the same keyboard session.

## Interaction Rules

- Do not trigger buttons or inputs after a pointer has become a drag. Preserve the drag suppression behavior in `MobileScroll`.
- Do not allow native browser image/file dragging inside the phone frame. Preserve the phone-level `dragstart` suppression and non-draggable image styles so scroll drags that begin on images still scroll the prototype.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for text entry so the simulated keyboard and safe-area insets stay connected.
- Fixed phone chrome should not animate with pushed screens. Screen content can animate; the status bar, camera cutout, and preview chrome should stay put.
- Keep the keyboard below the home indicator/safe area layer in z-index, and above ordinary app UI while visible.
- Keep the home indicator as the topmost safe-area layer in the z-index above everything else in the prototype.

## Whoof design decisions
- Source of truth: latest approved image exec-0955df15-2acd-4c42-ac28-6b6751a22564.png in the thread generated_images directory.
- Russian, neutral grayscale, generous whitespace. Status headline: «Самочувствие отличное», subtitle: «Сейчас Джека отдыхает после дневной прогулки.»
- Do not restore the oversized activity total above the chart or a day/week switch on Home. Totals stay below the chart.
- Floating four-item navigation capsule: Главная, Метрики, Прогулки, Профиль. Separate AI action at right.
- The pet image is provisional; future generated images will use real pet photos.
- All tracker readings, nearby dogs, recorded distance and AI replies are demo data. No real invitations, GPS or medical diagnosis.
- General prototype state is session-only. Medical documents are the exception: files persist locally in IndexedDB across reloads.

## Home annotations — 22 September 2026
- Remove the home wordmark and «На связи» indicator. Put pet avatar/name at left and a working notifications button at right.
- Replace numeric activity-minute axis with five intensity categories: Покой, Низкая, Средняя, Высокая, Очень высокая.
- Home date defaults to browser-local today. A BottomSheet calendar selects among the last 30 days; future dates are unavailable. No day/week switch.
- Daily chart supports pointer scrubbing and keyboard arrows/Home/End to select 15-minute intervals. Show provisional pulse/respiration readings below the chart; all values explicitly demo.
- Daily movement/rest totals are two cards, with very-high-intensity duration visible in the movement card. Tapping opens a complete additive duration breakdown.
- Current-day fixture is explicitly a demo snapshot at 14:30, historical fixtures cover 24 hours. Use the same intensity samples for chart and card totals.
- Preserve prior screens and floating navigation. All runtime files remain protected.

## Simplified chart — latest annotation
- Hide the left categorical-axis labels; expand the plot using 8px side insets. Retain subtle horizontal guides and time labels.
- Intensity remains available in selected-interval details and the movement breakdown. Never restore the bulky category-label column unless requested.

## Weather-style time ruler — latest annotation
- Activity exploration should be visibly interactive like the supplied Apple Weather ruler: horizontal time ticks move under a fixed central pointer, with selected time/intensity and metrics immediately visible.
- Use the template Carousel for the ruler. Synchronize its selection with the overview graph, arrows and keyboard; preserve the simplified graph without category labels.

## Metrics tiles — latest annotation
- Present metrics as separate grayscale clickable tiles in a two-column grid, with prominent values and small charts. The fifth metric spans both columns. Preserve metric detail sheets and existing navigation.

## Pet medical record — latest request
- Profile includes a Medical Record block for uploading photos/screenshots/scans, PDFs and documents. Use real local file selection, multiple files, list/detail views, original downloads and confirmed deletion.
- Documents persist only in this browser (IndexedDB); state this clearly. No server upload or automatic clinical interpretation. Other prototype data remains session-only.

## Day map heading — latest browser comments
- Replace the small Activity eyebrow with the larger left-aligned heading «Карта дня». Place the selected date and calendar dropdown at right on the same row. Remove previous/next-day arrows in this header; keep interval arrows and calendar month navigation.

## Day-map insights — latest request
- Continue changes in the grayscale whoof-prototype on port 4173; leave whoof-warm-redesign unchanged.
- Highlight selected moments with accessible, tappable monochrome markers on the chart. A marker opens an explanatory insight sheet and synchronizes the time selection/ruler.
- Social/play explanations are explicitly demo hypotheses, not proof that a particular dog, location or emotional state can be identified from physiological metrics. Tie displayed evidence/values to the selected day's actual fixture bins.

## Remove prototype boilerplate — latest request
- Remove routine user-facing «демо», «пример показателей», and similar captions/badges throughout the UI. Keep useful units, measurement periods, inference uncertainty and medical-file storage information. The About screen may explain the prototype, and internal data remain simulated.

## Single chart and slider — 24 September 2026 (supersedes ruler guidance)
- Update whoof-iphone on port 4176; preserve native-phone and warm variants.
- Approved visual: exec-b68eb0c9-8a7e-4e7b-bb70-482e2b37a356.png. One chart, explicit continuous time slider beneath, then «Интенсивность», «Период», «Длительность».
- Replace the mock’s «Всплеск активности» action label with «Инсайт»; open the existing insight sheet from this row or chart markers.
- Time is selected to the minute. Internal fixture samples remain 15-minute bins; period and duration describe contiguous movement/rest episodes, not fixed selection windows. Restrict selection to available data (today through 14:30).
- The collar has accelerometer/gyroscope, with microphone planned. This block and its insight sheet must not claim pulse or respiration measurements.

## Home section hierarchy — 24 September 2026
- «Карта дня» and «Итоги дня» are peer sections: matching 22px headings with the same weight and tracking.
- Separate daily totals from selected-moment details with 40px of whitespace; use 16px between the totals heading and cards.
- Keep secondary time metadata smaller (12px) and muted; card totals remain the primary numeric emphasis.

## Neutral moment rows — latest request
- Intensity, period and duration use identical plain rows: no filled background, no special bold emphasis. Labels and values use regular weight.

- Remove the redundant snapshot/date caption below the daily-total cards; keep the time coverage beside the «Итоги дня» heading.

## Metrics period and tile layout — latest request
- Remove mini charts from metric tiles. Keep charts in the existing detail sheet.
- Increase numerals, use smaller duration units to fit two columns, and anchor each value/explanation group to the card bottom.
- Add one Day/Week/Month selector above all tiles, default Day. Selection updates values, descriptions and date coverage, and is shared with the detail sheet; opening a metric must not reset the period.
- Week/month duration values are daily averages, explicitly labeled as such. Data remain local prototype fixtures.

## Settings hierarchy — latest request
- Replace bottom-navigation Profile with Settings and a gear icon. Settings is the parent for the separate pet profile and device settings.
- General settings follow the supplied grouped-list reference: security, notifications, language; about, privacy, terms; FAQ and support.
- Profile contains editable pet information, personal activity/rest/sleep baselines and the existing medical document store. Home avatar remains a direct profile shortcut.
- Back returns to the profile entry point; the Settings tab stays active inside the profile. Device controls live under Settings, not the pet profile.
- Do not fabricate published legal documents, account security or live support. Show availability honestly for unfinished services; preserve local-only prototype scope.

## Profile correction — latest request
- Remove baselines from the pet profile. Keep age, weight, breed and sterilization; add editable withers height (cm) and chronic conditions.
- New optional fields start unspecified, not with invented health information. Chronic conditions supports multiple lines. Retain the medical record.
- The clarification concerns the pet profile; it does not request changes to the AI screen.

## QR owner invitation — latest request
- Add Settings → Pet access, with a generated, scannable QR code, share/copy link, QR download, and a recipient preview.
- Recipient sees the pet and shared scope, explicitly accepts, then sees success and can enter the existing app without recreating the pet.
- Scope includes pet profile, medical documents, metrics/insights and walks. Personal AI conversations and preferences stay separate.
- This remains a frontend prototype: QR links use a public fixed preview token and contain no personal or medical data. QR opens the default sample dog, not the current browser's private records. Make this limitation visible near sharing and on the recipient screen.
- Local share origin uses 172.20.10.3:4176 when opened via localhost; other hostnames use their own origin. Same Wi-Fi is required for the LAN preview.
- No real authentication, account membership, cross-device synchronization, invitation expiry/revocation or Bluetooth pairing is claimed.

## Editable pet photo — latest request
- Profile avatar and edit form offer native image selection. Validate image decoding and 10 MB size limit; errors must not replace the existing avatar.
- Update the pet avatar across Home, Settings, Profile, AI and the owner invitation preview. Draft photo changes apply on Save and are discarded when the form closes.
- Photos remain session-local, like the existing pet fields. QR recipient demo continues to use the public sample dog; no photo is encoded in the link.

## design_v1 — Fuse visual system
- Work in branch `design_v1`, isolated folder `whoof-design-v1`, preview port 4177. Keep whoof-iphone / port 4176 unchanged.
- Source: Fuse iOS via Mobbin. See `references/fuse/ui-mapping.md` for inspected screens, observations and component mapping.
- This request supersedes grayscale-only styling: white canvas, near-black type/actions, neutral pale surfaces, small blue/purple/orange/cyan gradient icon tiles, subtle borders, fully rounded primary buttons and compact filled navigation icons.
- Preserve the current Russian content, structure, interactions, medical store and photo/QR flows. No finance-specific copy or new product features.
- Font identity is inferred visually; use the existing Apple system stack. Maintain readable secondary copy rather than copying the reference's faintest grays literally.

## Metric chart color — latest annotation
- Metric detail bars use subtle vertical gradients matching each tile icon: blue activity, purple sleep, coral pulse, cyan respiration, orange temperature. Colors identify categories, not health thresholds.
- Keep gridlines neutral and light, values/layout and period interactions unchanged. This scoped annotation concerns metric detail charts, not Home's day map.

## Metric date axis — latest request
- Week detail charts label all seven bars with Russian weekday abbreviations, corresponding to the displayed rolling seven-day range.
- Month detail charts label dates from the displayed rolling 30-day range, every five samples plus the final date to avoid crowded text. Align each label with its bar center; preserve category color and neutral axis type.

## Home color and AI actions — latest request
- Default pet portrait is the colorized sibling `dog-color.png`, preserving the original grayscale asset and using the shared photo state across screens. User-uploaded photos stay unfiltered.
- Home activity bars use the same soft blue gradient as the activity metric; selection/slider use a stronger blue, rest baseline and grid remain pale. Insight markers use a slightly deeper blue from the chart palette.
- AI dock action, metric-to-AI CTA and chat send button share a soft pastel lavender-to-blue gradient with dark readable text/icons. Keep other primary buttons black.

## Real-phone design preview
- Explicit user request: duplicate design_v1 without simulated device on a separate localhost. Port 4178, bind all interfaces.
- Native entrypoint/adapters own browser keyboard, scrolling, viewport and safe areas. Preserve source simulator on 4177.
- This standalone snapshot uses native-main.tsx and src/native; protected simulator files remain intact.
