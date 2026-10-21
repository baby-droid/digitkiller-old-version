---
name: Package install network limits
description: Repeated package registry access failures caused by this workspace's network proxy
---

When package installation fails with a registry/proxy transport error, treat it as an environment connectivity problem until the package manager reports a real resolution or compatibility error. Keep dependency edits targeted and confirm the lockfile with a frozen install after connectivity is restored.

**Why:** An imported-project dependency install was blocked by the environment proxy before package resolution could complete.

**How to apply:** Check whether the failure is a proxy/network error before changing dependency versions; after any required updates, run the package manager's frozen-lockfile install to verify reproducibility.
