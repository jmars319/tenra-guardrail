use crate::{
    audit::log::AuditLogEntry,
    policy::model::GuardrailPolicy,
    runtime::model::{RuntimeBoundarySnapshot, RuntimeOverview},
    tool_host::model::ToolRequest,
};

pub fn runtime_overview(loaded_policy_source: &str, audit_entry_count: usize) -> RuntimeOverview {
    RuntimeOverview {
        product_name: "Guardrail by Tenra",
        primary_surface: "desktop",
        runtime_shape: "headless-service",
        tool_host_boundary: "required",
        policy_mode: "deterministic-deny-by-default",
        network_tooling_enabled: false,
        loaded_policy_source: loaded_policy_source.to_string(),
        audit_entry_count,
    }
}

pub fn runtime_boundary_snapshot(
    loaded_policy_source: &str,
    policy: GuardrailPolicy,
    audit_entries: Vec<AuditLogEntry>,
) -> RuntimeBoundarySnapshot {
    RuntimeBoundarySnapshot {
        loaded_policy_source: loaded_policy_source.to_string(),
        policy,
        sample_requests: sample_requests(),
        audit_entries,
    }
}

fn sample_requests() -> Vec<ToolRequest> {
    vec![
        ToolRequest::sample_read_file("diagnostic-read-readme", "README.md"),
        ToolRequest::sample_read_file("diagnostic-read-env", ".env"),
        ToolRequest::sample_read_file("diagnostic-read-ssh", "~/.ssh/id_ed25519"),
        ToolRequest::sample_write_file(
            "diagnostic-write-outside",
            "../guardrail-outside.txt",
            "agent output",
        ),
        ToolRequest::sample_shell_command("diagnostic-shell", "rm -rf /tmp/guardrail-test"),
        ToolRequest::sample_network_request(
            "diagnostic-network",
            "https://api.openai.com/v1/models",
        ),
    ]
}
