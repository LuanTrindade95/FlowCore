# ADR-019 - Runtime schema and visibility

## Status

Accepted on 2026-06-10.

## Context

Runtime screens need published form metadata, instance history and decision capabilities. Client-only filtering or duplicated form schemas would drift from the engine and could expose requests across users.

## Decision

- Serve only the latest published workflow version through the runtime catalog.
- Generate request forms from published `form_fields`.
- Revalidate submitted data in `WorkflowEngine`.
- Apply `WorkflowInstance::visibleTo()` and policies to server-side queries.
- Return action flags derived from policy and step state.
- Normalize legacy nested select options at the model/resource boundary.

## Consequences

- The backend remains authoritative for schema, visibility and actions.
- Angular can render dynamic forms without a parallel business schema.
- Runtime resources are richer, so eager loading is mandatory to avoid N+1 queries.
- Legacy demo data remains readable while new records use the canonical options array.
