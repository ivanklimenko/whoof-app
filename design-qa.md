# Whoof design_v1 — Fuse visual system

final result: passed

## Scope and source
Visual redesign of the existing Whoof prototype, in isolated Git branch `design_v1`. This is a transfer of Fuse's UI system to Whoof, not a clone of its finance content or page order. All existing product flows and Russian content are retained, with the shared-owner entry moved into the Settings emphasis banner.

Source screens inspected via Mobbin MCP:
- `references/fuse/home.webp` — https://mobbin.com/screens/a669417b-96c1-42cb-a6bb-01a8761397e4
- `references/fuse/settings.webp` — https://mobbin.com/screens/20a9a10c-08af-4b79-a9ad-a095b7aa6915
- `references/fuse/earn.webp` — https://mobbin.com/screens/148223e1-e49d-4f82-a5c4-d4d7a1d02120
Additional Cash and edit-sheet references are linked in `references/fuse/ui-mapping.md`.

Source frames: 1179×2676 px including Mobbin credit footer, normalized to 393px width / 3× downsampling for comparison; the lower credit footer is excluded by a 852px crop. Implementation: 393×852 CSS px, deviceScaleFactor 1, unscaled iPhone; additional Pixel inspection at 427×952. Outer desktop viewport: 1400×1200. Live clock and protected device chrome differ intentionally.

## Evidence / comparison
Combined source-and-implementation inputs were rendered and opened:
- `qa/v1-compare-tiles.png`: Fuse home card system against Whoof metrics, day selected.
- `qa/v1-compare-settings.png`: both Settings screens at initial scroll position.
- `qa/v1-compare-home.png`: Fuse dashboard hierarchy against Whoof home.

The paired 393px panels are legible at native scale; card icons, labels, outlines, and nav symbols were inspected in those inputs. No separate enlargement was necessary. Additional standalone states opened: `qa/v1-totals.png`, `qa/v1-walks.png`, `qa/v1-profile.png`, `qa/v1-ai.png`, `qa/v1-metric-detail.png`, `qa/v1-edit.png`, `qa/v1-access.png`, `qa/v1-medical.png`, `qa/v1-pixel-metrics.png`. Other flow captures are in `qa/v1-*.png`.

Different content density is intentional: Whoof retains the day slider/details and its larger metric values, four named navigation tabs, longer Russian settings entries, and medical files. Fuse's finance balances, brand mark and token artwork are not imported. Lists scroll above the existing floating nav; lower cards and final settings rows remain reachable.

## Comparison history
1. First pass: white surfaces, icon tones, card anatomy, rounded black actions and settings grouping matched the selected visual direction. [P2] Navigation labels at 9px were too small after adaptation to four Russian tabs; metric titles and setting labels needed a larger optical size. Increased nav labels to 10px, icons to 24px, metric titles to 13px and setting labels to 14px. Darkened small secondary captions to #767676. [P2] An older more-specific chart rule retained 158px height instead of the intended 142px; corrected the final selector.
2. Recaptured the same states with `node qa/design-v1.mjs`, opened the regenerated paired comparisons, and inspected Pixel metrics and medical sheet. Labels fit, quantities stay inside card bounds, chart/details retain hierarchy, and controls remain available. No remaining P0/P1/P2 findings in this redesign scope.

## Required fidelity surfaces
- Typography: existing Apple system font stack is visually close to Fuse. Exact source font metadata is unavailable, so no exact-family claim is made. Primary numbers are 28–42px, secondary units smaller and gray, page headers compact. Russian text wraps without clipped values. The status message keeps its existing meaning and uses the source's two-tone display hierarchy.
- Spacing/layout: 24px insets, 10px tile gaps, 16px card padding, 22–25px card radii, shared 36px section break, 48px pill actions. Tile space groups icon above label/value. Existing 44px slider/insight targets and protected screen/keyboard geometry are retained.
- Colors/tokens: white dominant canvas, #080808 actions/text, #fafafa/#fdfdfd surfaces, #efefef hairlines. Accent colors appear mainly on category icons and insight markers. Native CSS gradients style these UI surfaces as explicitly requested; they do not replace illustrations. Small copy is darker than the faintest reference text for readability.
- Images/icons: existing dog photo and map retained; no new image assets required. Phosphor filled symbols replace outline emphasis where appropriate, matching the source's rounded solid icon language. Custom photo replacement still renders correctly. Source financial illustrations/logos are intentionally excluded.
- Copy/content: Whoof vocabulary, periods, metric fixtures, settings, medical-file storage caveat and invitation preview limitations retained. No finance labels or developer-facing redesign instructions appear in the product.

## Functional verification
Passed:
- `npm run build` including all 28 protected runtime file hashes; only the existing non-blocking large-bundle warning.
- `git diff --check`.
- `node qa/design-v1.mjs`: every main screen, detail/edit/medical sheets, walk start/pause/save/history, invitation acceptance/success, AI answer, iPhone/Pixel, paired visual captures.
- `node qa/check.mjs`: keyboard minute selection, mouse drag, touch drag, current-day endpoint, calendar dates, both chart and row insight actions.
- `node qa/metrics.mjs`: day/week/month values, detail synchronization and selection retained across navigation.
- `node qa/settings.mjs`: profile/back routes, device settings, general rows, notification toggle, FAQ, medical upload/navigation persistence/confirmed deletion.
- `node qa/invite-photo.mjs`: independently decoded QR, copy action, second browser recipient flow, invalid link, actual file selection, draft cancel/save, corrupt-image rejection and avatar propagation.
All browser checks report no page errors.

## Boundaries / follow-up
This remains a frontend prototype with fixture data; real accounts, collar communication and cross-device data sync are not introduced. Photo/profile edits remain session-only, medical documents remain browser-local. Exact proprietary Fuse icon artwork and font metadata are unavailable; standard icons/system fonts are an intentional approximation. Native operating-system sharing and physical camera scanning were not exercised (the QR was programmatically decoded). Device runtime animation behavior is unchanged; no new animation was added beyond short button press transitions with reduced-motion handling.

## Follow-up: colored metric charts
User requested subtle color in metric detail charts. Bars now use a restrained vertical gradient matching each metric tile: blue, purple, coral, cyan and orange. Gridlines stay neutral and slightly lighter; layout, fixture values and period behavior are unchanged. The accessible chart name now identifies the metric and period.

Build/runtime integrity and the existing metrics browser check pass, including day/week/month synchronization and navigation. Opened and inspected all five `qa/metric-color-0.png` through `qa/metric-color-4.png` captures: hues match the corresponding icons, bar edges remain clear and neutral controls preserve hierarchy. No page errors or new visual findings. This annotation supersedes the previous gray metric bars; Home day-map styling is unchanged.

## Follow-up: weekday/date labels
Added centered x-axis labels to metric details: each weekday for the rolling seven-day view and every fifth sample plus the endpoint for the rolling 30-day view. Dates are derived from the same local today/range logic as the caption, including month boundaries. Extra bottom space separates labels from the plot without moving the surrounding controls. Inspected `qa/metric-week-axis.png` and `qa/metric-month-axis.png`: all labels fit, align with their bar centers, and agree with the visible ranges (18–24 September and 26 August–24 September). Build/runtime integrity, diff check and existing metrics browser interactions pass; no page errors.

## Home and AI color follow-up
- Colorized default pet portrait; blue Home bars/slider and coordinated blue insight markers.
- AI actions use a softer lavender/blue gradient with dark foregrounds.
- Build, runtime integrity, full screen/navigation/interaction browser checks passed.
