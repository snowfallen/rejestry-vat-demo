# Deployment

## Vercel

The submission target is Vercel. No secrets are required by the app itself.
Use pnpm 10.34.9 and Node 24. `vercel.json` selects Next.js and verifies
formatting, types and domain tests before the production build.

`output: 'standalone'` supports the optional Docker target; Vercel still handles
its own application packaging. The `/healthz` endpoint is dynamic and uncached.
The page renders per request because it reads the period, register and search from the address; session interactions run in the browser.

The Actions deployment job is opt-in and depends on all checks, including
production-browser tests and a Docker smoke test. Keep `VERCEL_TOKEN` in the
GitHub `production` environment, never in a repository file. Choose one production
deployment mechanism to avoid racing automatic Git deployments with gated CD.

## Portable runtime

The Node 24 Alpine base image is pinned to the manifest digest verified during
the local container build. Establish a digest/dependency update process before
production adoption. Package dependencies use the committed frozen lockfile.

The container and base manifests do not require privileged access, writable root,
or a cluster API token. Only `/tmp` is writable. No application state lives on disk;
session edits reset on reload and must not be mistaken for persistent accounting data.

Build and push an immutable image with a release/commit tag. In a deployment
overlay, set the image repository and tag/digest via Kustomize `images`, supply
an image pull secret if necessary, and add an ingress for the intended hostname.
Use the cluster's own TLS issuer and ingress controller.
Review network policy for the target cluster before adding default-deny rules.

Validate the rendered manifest before applying. A real k3s rollout and ingress/TLS
test require a target cluster and are outside the local verification claim.
