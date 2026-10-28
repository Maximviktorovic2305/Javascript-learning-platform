# Patched deepmerge

This private package vendors the self-contained CommonJS distribution and types
of MIT-licensed [deepmerge 4.3.1](https://github.com/TehShrike/deepmerge/tree/v4.3.1).
It is installed as `deepmerge` using npm's file dependency and `$deepmerge` override.

Upstream has no published fix for
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
All three object-property writes use `Object.defineProperty` instead of assignment.
This prevents an own `__proto__` property in either operand (including a null-prototype
target) from changing the result's prototype, while retaining ordinary merge,
array, symbol, cloning and custom-merge behavior. The existing inherited-property
guard remains in place.

This is a local security patch, not an upstream patched release. npm audit does
not independently validate the contents of local packages. `npm test` therefore
first runs `node --test vendor/deepmerge/security-check.cjs` against the installed
dependency, including CommonJS and ES module consumers. Keep those tests and the
MIT attribution when updating the vendor; return to upstream when a reviewed fix
becomes available.
