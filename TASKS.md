# Home tasks design

Source: Whoof Activity Classes (1).xlsx, Задания!A1:E286. Workbook remains unchanged. Titles, instructions and capture modes are copied exactly.

## Current design
- Home exposes four tasks in a compact horizontal Carousel, in any order: source rows 2, 29, 172, 12. Each 180 px Home card uses a soft pastel gradient, shared AccentIcon and a quick action; tapping its body opens detailed instructions. One card centers after each swipe; adjacent cards remain partially visible and slightly smaller. Native touch scrolling owns the gesture. Progress and «Посмотреть все задания» remain outside the rail.
- All tasks opens 12 expandable cards: source rows 2, 29, 172, 12, 21, 97, 119, 128, 138, 195, 204, 275. Each has one expansion control and a separate quick action.
- The assigned set is a static prototype selection, not an inferred ranking or backend scheduling algorithm. Column D weights are not used.
- Daily progress counts only the four assigned tasks completed on the browser-local current date. Catalogue completion counts the full selection separately. Yesterday's results do not count toward today's progress.
- Tasks stay visible after completion and keep their order. Swiping scrolls the cards; completion requires the explicit action button.

## Capture and persistence
Retrospective and Instant use one-tap «Готово» with an immediate local timestamp. Interval uses «Начать» then «Готово», retaining start/end timestamps. Only one interval can be active. There is no success modal after quick completion; the most recent completion can be undone. Optional feedback preserves an already marked event timestamp.

Progress, the active interval and the latest result per task persist in localStorage only. No actual collar acquisition or backend submission is implemented.
