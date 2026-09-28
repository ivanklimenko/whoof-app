# Whoof · design_v1

Fuse-inspired visual redesign of the current clickable Whoof prototype.

- Branch: `design_v1`
- Preview: http://localhost:4177/
- Original grayscale preview: http://localhost:4176/
- Base checkpoint: `f9257c1` (includes latest QR, profile photo and settings features).
- Visual analysis and screen-to-component mapping: `references/fuse/ui-mapping.md`.
- Validation and visual comparisons: `design-qa.md`, `qa/v1-*.png`.

App source lives in `src/Prototype.tsx` and `src/prototype.css`. The final Fuse section in the stylesheet contains the visual tokens and component adjustments. Protected mobile runtime is unchanged.

For a fresh checkout, run `npm ci`, then `npm run dev -- --host 0.0.0.0 --port 4177 --strictPort`. Run `npm run build` for TypeScript, production build and runtime-integrity checks. This local worktree uses an ignored dependency symlink to the existing prototype's identical dependency installation; it is not part of the repository.

To compare the old version, keep using the original worktree. Do not reset or overwrite it. Switching or inspecting the base checkpoint in this branch also provides the pre-redesign state.
