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

## Early-owner tasks — 25 September 2026
- Current working version: Whoof/приложение/design v1, native preview 4178. Grayscale functionality and archived mockup remain unchanged.
- Home includes a compact task card after wellbeing, before the day map. Show first-task progress and expandable instructions directly on Home.
- Source: Whoof Activity Classes (1).xlsx, sheet Задания. Initial assigned design set uses source rows 2, 29, 172; preserve exact titles/instructions. The 285-row catalogue is not a mandatory checklist or inferred schedule.
- Task collection uses friendly pastel expandable cards with clear chevrons. Avoid a plain list.
- Retrospective and Instant: immediately mark completion on «Готово». Interval: «Начать» then «Готово», keeping both timestamps. Do not use the unclear action «Отметить момент».
- Optional feedback follows marking and never shifts an already captured event time. Failed/partial attempts do not count as completed; retries remain available.
- Progress, active interval and feedback persist only in this browser via localStorage. No collar acquisition or backend submission is implemented; disclose local-only storage in task details.

## Daily set and catalogue — latest feedback
- Keep the approved Home card styling and progress. Show four assigned daily tasks in a compact horizontal Carousel with independent quick actions; this latest request supersedes the earlier vertical list. Cards are approximately the height of day-summary cards. Open instructions in a detail sheet and keep «Посмотреть все задания» below the collection.
- «Посмотреть все задания» opens 12 source-backed cards (10–15 requested). Remove the duplicate «Что нужно сделать» expansion button; the card header is the only expander.
- Completion is immediate and inline, with undo; do not interrupt each quick mark with a success sheet. Interval tasks start/finish in-place.
- Daily progress counts only today's assigned set; other catalogue tasks and yesterday's marks do not advance it. The source selection is a prototype fixture, not a scheduling algorithm.

## Task UI consistency — latest feedback
- Match tasks to the current Fuse-inspired app: shared neutral card surface/border/radius, 16 px padding, shared AccentIcon gradients and neutral secondary actions. Use the same system typography and neutral secondary text as metrics/day summaries.
- Preserve compact horizontal cards, progress, all-tasks entry, quick completion and detail sheets. Completed actions show an explicit check and «Выполнено»; active interval actions and the detail primary action use the shared black emphasis.

## Task reference implementation and correction
- Keep the existing gradient AccentIcon symbols; the user explicitly rejected adding dog illustrations. No generated illustration is used in the app.
- Preserve 204 px task-card height, horizontal Carousel with visible next card and positional dots/hint. Overall completion remains above the collection.
- Catalogue uses compact cards with a separate 44 px quick-completion/start control and one header expander. Detail sheet identifies ready, in-progress and complete states; show elapsed time only for an active Interval task.

## Centered gradient task deck — latest request
- Home now presents one almost full-width 180 px-high task card. Adjacent cards peek from both sides after swiping, scaled to 91% with a small inward offset. First/last cards also center; no looping or duplicate tasks.
- Soft lavender, blue, peach and mint gradients on Home only. Retain shared icons, title, duration, clear quick action, overall progress and full catalogue link; no illustrations.
- Native-phone Carousel has an opt-in centered mode using browser scroll snapping. This scoped native-adapter exception implements the requested settling behavior; protected simulator Carousel and its no-snap contract remain unchanged. No custom pointer capture or swipe recognizer.

- Task deck overlap refinement: increase neighbouring cards’ inward visual offset from 12 to 36 px so they tuck behind the central card. Keep card size, scale and layout stride unchanged.

- Task deck depth refinement: neighbours now scale to 85% (previously 91%); the central card remains full size and the 36 px inward offset is retained.

## Duplicate cleanup — 25 September 2026
- One persistent completion status per task; preserve daily aggregate progress, capture timestamps, and a six-second inline undo. Keep source task descriptions intact; adapt instructions at presentation time to avoid duplicate recording instructions.
- Completed tasks use a static labelled check; pending catalogue actions use an empty circle or Play. Keep the carousel/deck geometry; hide the swipe hint once another card has been viewed.
- Pet photo editing lives in «Изменить профиль»: one combined photo/label picker, draft until Save; closing discards edits. Profile itself shows the photo and one editing entry.
- Keep the location status row on Walks and entry in Security; remove the duplicate header action. Merge FAQ/placeholder support into «Помощь».
- Keep both general AI and metric AI entry points. Metric discussions preserve the selected reading/date/period, separate conversation history from the general chat, and return to the metric sheet.
- Keep QR and Share primary; place copy/download in «Другие способы» and prototype recipient preview in a separate disclosure. Retain the honest local-only sharing limitations.
- Keep insight marker and textual entry. Label its return action «К графику»; preserve uncertainty without repeating the hypothesis in the body.

## AI from Home — latest request
- Both daily-total cards include a soft gradient «Обсудить с AI» action separate from their breakdown button; no nested buttons. The breakdown sheet also offers the same contextual action.
- Insight details use the same AI action; «К графику» remains a secondary return.
- AI receives the selected date, actual fixture totals/breakdown or insight evidence and uncertainty. Context conversations remain separate. Back restores the selected day and originating card/sheet.

## Completed daily tasks — latest request
- Home orders pending daily tasks first, completed tasks last in completion order. After reordering, center the first pending task; preserve the existing deck sizing/gestures.
- When all assigned daily tasks are complete, replace the carousel with a compact congratulatory banner. Keep progress and «Посмотреть все задания» available.
- Remove temporary Home undo. Permanent «Отменить выполнение» is in the expanded completed card inside «Все задания». Cancellation returns the task to pending and updates Home; interval tasks restart with a fresh timer rather than resuming an old finished interval.

## AI buttons in daily totals — latest correction
- Remove AI actions from collapsed Home summary tiles. Keep «Обсудить с AI» only inside movement/rest detail sheets; preserve context and return behaviour. Insight AI remains unchanged.

## Metrics header — latest annotation
- The metrics screen header contains only «Метрики»; remove the pet-name eyebrow and decorative chart icon. Preserve subtitle, period selector and metric tiles.

## Task progress — latest correction
- Remove the segmented progress bar above daily tasks; keep only the text count (e.g. «0 из 4»). No streak UI is approved yet. Reset existing preview task completions/active timer once for this revision, then persist new progress normally.

## Native task carousel fix — latest request
- Snap alignment belongs to stable outer task slots; only the inner card surface scales/translates for the recessed-neighbour effect. Cache slot geometry on resize, batch transform updates in one animation frame, update pagination state only when the nearest card changes.
- Preserve native touch scrolling, vertical parent scrolling, card reordering and 85% neighbour scale/36px overlap. No custom touch recognizer or scroll-end correction loops.
- Entire wellbeing headline uses the same dark text colour; «отличное» is no longer grey.

## Bottom-sheet gestures — latest request
- All native bottom sheets slide fully up from the bottom and back down on dismissal, preserving their content throughout exit. Dragging the 44px top handle moves the sheet and fades its scrim; a short/cancelled drag returns it, a sufficient pull or downward flick dismisses it. Content scrolling stays independent. Respect reduced motion and retain close buttons, backdrop and Escape dismissal.
- Reset preview task completion and active timers once for the sheet-preview revision; subsequent progress persists normally.

## Glass scroll edges and navigation — latest request
- Native content scrolls to the bottom of the viewport behind floating navigation; reserve final content padding instead of shortening the scroll viewport. Preserve safe areas and keyboard layout.
- Scrolled content at the top passes under a light blurred white-to-transparent fade. Its intensity follows the first 28px of scroll; it never blocks gestures.
- Navigation capsule and AI dock use translucent surfaces, backdrop blur and a restrained glass highlight. No full-width opaque bottom panel.

## Authentication prototype — 28 September 2026
- First launch shows login, with reciprocal links to email/password registration. Registration requires at least 8 Unicode characters, a lowercase and uppercase letter, digit and punctuation/symbol. Show live requirements, password visibility and inline errors.
- User explicitly chose a clickable prototype, not real authentication. Credentials exist in memory only until refresh; never persist or transmit passwords. Test fixture: demo@whoof.app / Whoof2026!. Signed-in state lasts until logout or reload.
- Yandex ID and password recovery honestly show preview flows, no OAuth requests or fake sent-email claims. Settings shows the current preview account and logout. Incoming pet invitations retain their query parameters through authentication.

## Local auth visual refinement — latest feedback
- Work locally only; do not deploy to Vercel until explicitly requested again.
- Auth uses the existing app typography, neutral rounded fields and pill buttons. Email submit is the black primary action; Yandex is a light secondary action below it. Keep a compact wordmark/header, shared settings icon styling for logout, readable requirements/errors and a quiet, honest prototype note.

## Auth welcome — latest request
- First launch and logout show a welcome screen with only two actions: «Создать аккаунт» and «Войти». Email/password fields and Yandex remain on the next screen. Both forms have a back button to welcome.
- Reserve a large quiet artwork area for an image the user will supply later; do not generate or add an illustration. Keep the wordmark above, short welcome copy and both pill buttons below, respecting the mobile viewport and safe areas.
- Welcome header uses the supplied `public/assets/whoof/logo.svg` centered at its original aspect ratio, replacing the typed wordmark. Keep the artwork area reserved.

## Local fictional scenarios — friendship walk
- User explicitly requests local fake scenarios only; do not publish. Home and notifications show «Боня собирается в парк. Присоединитесь?» with one-tap joining.
- Joining opens an active shared walk in Walks; finishing creates one memory in history with a sample 42-minute / 2.4-km route and generated photo. The same memory is reachable from Home and notifications. Replay removes only this scenario's memory and restores the invitation.
- All scenario state is in memory. No push, GPS, owner messaging or sharing APIs. Do not interrupt an ordinary recorded walk: joining stays disabled until it ends.
- `public/assets/whoof/friends-walk.png` is a fictional golden retriever/corgi park photo generated with the built-in imagegen tool, not evidence of a real walk. Prompt and provenance: `references/friend-walk-photo.md`.
- Simulate an iOS notification inside the web viewport: delayed top entrance on Home, frosted surface, upward swipe/Escape/close dismissal, timed exit, and tap opens the existing invitation. It is delivered once per scenario run; replay triggers it again. Respect notification settings, modal visibility, safe areas and reduced motion. No actual push/OS permissions.

## Remember prototype sign-in — latest request
- Remember only the preview account email/provider in `whoof.preview-session.v1` localStorage. Refresh and reopening this browser retain sign-in; explicit logout clears it. This supersedes the previous reload-logs-out rule.
- Passwords and the registration credential map remain memory-only. Stored identity is a UI convenience, not real authentication. Handle malformed or unavailable storage without breaking the app. Keep scenario state separate.

## Manual invitation trigger — latest correction
- Remove the pending invitation card from Home; retain invitation details under the bell and in Walks, plus active/completed Home states.
- No automatic iOS banner on launch or scenario replay. An invisible, keyboard-accessible 44px-tall button in the header gap between the pet name and bell schedules it five seconds after tapping. Repeated taps restart one countdown; navigation does not restart it, open sheets defer delivery. Reload clears the pending timer.
- Respect notification settings and avoid interrupting an active walk. Replay returns to idle; tap the hidden header button to run the notification again.

## Metrics from movement classification — 28 September 2026
- Replace the previous five metrics with Movement and Sleep. Details show walking/running and night/day sleep durations; Home and Metrics share daily totals. No heart rate, respiration or temperature readings, including mock AI replies. Gait classification does not establish speed in km/h.
- Food and water are timestamped recognised events, not consumption amounts. Sniffing, scratching and shaking are contextual signals, not permanent tiles.
- Day shows the existing partial snapshot through 14:30. Week/month show averages over the previous 7/30 completed days and actual per-day bars. Keep period context when opening details and discussing with AI.
- These are prototype fixtures, not a deployed classifier or live sensor readings. The user subsequently authorised publishing this update to the existing Vercel whoof-app project on 28 September 2026.

## Temporarily remove authentication — latest request
- The shared prototype opens directly into Home, without login, registration or an account/logout section in Settings. Incoming invitation URLs still open the invitation flow directly. Existing stored identity is ignored; task progress and medical documents remain untouched.
- Keep the prior auth component dormant for possible restoration; it has no UI entry point. This supersedes the welcome/login gate requirements.

## Design consistency — primary rule
- Design consistency is the highest-priority rule for all future work. New screens, components, states and interactions must reuse the established visual system, spacing, typography, surfaces, icon treatment, controls and interaction patterns. Do not introduce a separate visual language unless the user explicitly requests a redesign.

## Veterinary insight — 29 September 2026
- Copy refinement: call the source «устройство», not «ошейник», throughout veterinary screens and the export. Remove the summary captions «Запись в клинику через приложение пока недоступна.» and «2026 год. Еда и питьё — количество подходов.»; do not imply a booking occurred.
- Latest refinement: the metrics insight is a compact banner without a chart, with the veterinarian action right-aligned. Keep access to the treatment comparison.
- Approved four-screen concept: metrics insight, reason/attachments, veterinarian change summary, before/after treatment. Reuse existing pastel cards, AccentIcon, type and black pill actions. No «Демо» labels.
- Activity, rest, food and drinking all come from collar readings in this scenario. Food/drinking are counts of approaches, never consumed grams or millilitres and never owner-diary measurements.
- Keep data simulated internally, timestamp the insight snapshot, disclose local-only documents, and never claim an appointment or transmission happened without a real integration. Sharing must be user initiated after review.
- Compare equal periods around a user-supplied treatment start date; use separate chart scales for minutes, hours and counts. Do not infer treatment efficacy or a diagnosis.

## Annual recap story — latest direction
- The annual recap is a full-screen, tap-through story experience. Do not show a «Начать» button on its cover; the cover advances by tapping or timed progression like the rest of the story.
- For every annual-recap highlight concept, provide both the complete UI screen and a separate clean background image without text, controls, progress indicators or story chrome. When a dog photo is needed, use the repository asset `public/assets/whoof/dog-color.png`; preserve the photographed dog's identity instead of generating a different dog.
- Preserve system-level consistency without repeating one composition. Each highlight needs a distinct visual metaphor and layout—such as typography, map, collage, diagram, cropped photography or abstraction. Do not default to a pastel landscape with a large centered dog; the dog may be small, off-center, tightly cropped or absent when the concept is stronger without it.
- The user's numbered 13-item annual-highlight list is the content source of truth. Preserve its exact titles, figures, claims, wording and use of the names «Джека»/«Джесси» for each corresponding item; do not fact-check, normalize, rewrite or substitute copy unless explicitly requested.
- Annual-recap concepts may draw from the broader landing-page dog-photo library in `/Users/andrew/Desktop/Андрей/whoof/land-main/assets/`, especially the hero, problem-carousel, community and care images. Prefer these existing project photographs over repeatedly reusing `dog-color.png` or generating replacement dogs; choose a different source image to match each highlight's story.
- The current Whoof collar is the black woven-fabric collar shown in `references/current-collar/`: an integrated matte-black rectangular sensor housing with rounded corners and an oval front control. Do not use the obsolete blue patterned collar or a separate hanging tracker in new imagery. When adapting an existing landing photo, replace only the obsolete collar/device with this current black collar while preserving the dog and scene.
