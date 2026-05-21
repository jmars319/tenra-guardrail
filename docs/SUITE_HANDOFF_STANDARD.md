# Suite Handoff Standard

Generated from `tenra Hub/contracts/handoff-catalog.json` by `tenra Hub/scripts/generate-suite-contract-docs.mjs`.

## App Role

shared review and decision service

keep unique as a reusable module; source apps should request decisions instead of embedding review policy.

## Standalone Mode

Runs as a complete review queue and decision workspace with local requests, templates, decisions, callback retries, and exports.

## Repository Path

`capabilities/safety/tenra Guardrail`

## Accepted Inputs

- `tenra-scout.opportunity-handoff.v1` from tenra Scout
- `tenra-guardrail.external-action-review.v1` from source apps
- `tenra-partition.lab-validation-request.v1` from tenra Partition
- `tenra-partition.lab-validation-result.v1` from tenra Partition
- `tenra-align.review-reply-route.v1` from tenra Align
- `tenra-derive.reasoning-brief.v1` from tenra Derive
- `tenra-sentinel.risk-brief.v1` from tenra Sentinel
- `tenra-vicina.workflow-handoff.v1` from Vicina by tenra

## Emitted Outputs

- `tenra-guardrail.external-action-review.v1` to tenra Guardrail
- `tenra-guardrail.external-action-decision.v1` to source apps

## Standard Controls

- schema badge
- correlation id
- preview payload
- decision templates
- history
- retry failed
- download JSON
- destination presets
- send or export
- import history
- blocked queue
- route timeline
- conflict history
- brief comparison
- version comparison
- inline errors
- endpoint health
- workflow timeline

## Status Vocabulary

- `draft`: Payload or route exists locally but has not been previewed.
- `previewed`: Payload was built and inspected without delivery.
- `queued`: Delivery is waiting for an endpoint, retry, or operator action.
- `sent`: Producer posted or exported the payload successfully.
- `accepted`: Consumer parsed and retained the payload.
- `rejected`: Consumer refused the payload for schema, routing, safety, or policy reasons.
- `failed`: Delivery failed before acceptance or rejection was known.
- `replayed`: Registry or a producer regenerated a prior payload for another delivery attempt.
- `received`: Consumer acknowledged receipt back to the source app.
- `dismissed`: Operator intentionally removed an item from an inbox, queue, or retry list.

## Local Storage

Prefix: `tenra.guardrail`

- `tenra.guardrail.reviewQueue.v1`
- `tenra.guardrail.decisionHistory.v1`
- `tenra.guardrail.callbackRetries.v1`

## Endpoints

- POST `/api/external-reviews` - External reviews
- POST `/api/external-review-decisions` - External review decisions
