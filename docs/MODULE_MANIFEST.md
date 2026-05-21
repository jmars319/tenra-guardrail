# Module Manifest

Generated from `tenra Hub/contracts/handoff-catalog.json` by `tenra Hub/scripts/generate-suite-contract-docs.mjs`.

## Standalone Mode

Runs as a complete review queue and decision workspace with local requests, templates, decisions, callback retries, and exports.

## Repository Path

`capabilities/safety/tenra Guardrail`

## Required Suite Dependencies

- None

## Optional Suite Dependencies

- tenra Scout: Optional outreach/action review source.
- tenra Partition: Optional unsafe disk-action review source.
- tenra Align: Optional publish-route review source.
- tenra Derive: Optional reasoning review source.
- tenra Sentinel: Optional risk review source.
- Vicina by tenra: Optional workflow review source.

## Provides

- external action review
- decision callback
- decision export
- failed callback retry

## Consumes

- review requests
- callback endpoints

## Contracts

Emits:

- `tenra-guardrail.external-action-review.v1`
- `tenra-guardrail.external-action-decision.v1`

Accepts:

- `tenra-scout.opportunity-handoff.v1`
- `tenra-guardrail.external-action-review.v1`
- `tenra-partition.lab-validation-request.v1`
- `tenra-partition.lab-validation-result.v1`
- `tenra-align.review-reply-route.v1`
- `tenra-derive.reasoning-brief.v1`
- `tenra-sentinel.risk-brief.v1`
- `tenra-vicina.workflow-handoff.v1`

## Rules

- Each app must remain complete and usable without another tenra app running.
- Suite integrations are optional module links, not required runtime dependencies.
- Shared functions should be exposed through explicit local APIs, exports, imports, or schemas.
- No app may read another app's private filesystem, database, or localStorage state.
- Registry can index and audit the module graph, but it must not become a hidden runtime bus.
