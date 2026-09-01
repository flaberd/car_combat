# Missing Documentation

Documentation known to be incomplete or not yet written. Add an entry when
a task can't complete its documentation update; remove it once written.

---

## Visual Approach (grey-box policy) has no standalone document

The former `constitution.md` had a "Visual Approach" section (grey-box
until the core loop is locked; grey-box assets still go through the
`.glb`/`.gltf` pipeline). It's referenced from
[Core Loop Lock](../decisions/006-core-loop-lock.md) but doesn't have its
own decision/architecture doc yet. Write one when art-style work actually
starts.

---

## Destructible objects have no feature doc

[MVP Scope Discipline](../decisions/007-mvp-scope-discipline.md) states the
non-goal (no physical destruction, 2–3 state HP-threshold visual swaps
only), but no `src/` module implementing this was found at migration time —
likely not built yet. Write a feature doc once it exists in code.

---

## Deployment/dev-setup workflow isn't documented under `docs/`

`.github/workflows/deploy.yml` handles GitHub Pages deployment and
`package.json` has the standard `dev`/`build`/`test` scripts, but there's no
`docs/architecture/` note tying them together (e.g. what triggers a deploy,
any required GitHub Pages settings). Low priority — this is discoverable
directly from those two files — but flagged here per the workflow's
"if it can't be completed now, note it" rule.

---

## Related Documents

- [Knowledge Gaps](knowledge-gaps.md)
- [Core Loop Lock](../decisions/006-core-loop-lock.md)
- [MVP Scope Discipline](../decisions/007-mvp-scope-discipline.md)
