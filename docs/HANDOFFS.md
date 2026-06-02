# Guardrail by Tenra Handoffs

Guardrail by Tenra stays unique because runtime policy enforcement, Tool Host boundaries, approvals, and audit review must be reusable across apps.

## Consumes

- `tenra-guardrail.external-action-review.v1` requests from Proxy, Registry, Align, Scout, Sentinel, Vicina, Partition, and manual workflows.
- Optional review `callbackUrl` values, stored as the default decision callback endpoint for the request trace.
- Runtime snapshot evidence and policy context for review.

## Produces

- Runtime boundary snapshots.
- Review decisions for external send/publish/write/charge/command/system-change/moderation actions.
- Audit-friendly evidence summaries.

Guardrail should not shape copy or decide business outcomes. Proxy owns text shaping; the calling app owns the domain action.
