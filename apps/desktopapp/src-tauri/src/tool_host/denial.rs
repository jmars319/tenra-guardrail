use crate::{
    policy::evaluator::DenialTrigger,
    tool_host::model::{
        DenialRiskCategory, ToolDeniedResponse, ToolRequest, ToolRequestKind,
    },
};

pub fn build_denial_payload(request: &ToolRequest, trigger: DenialTrigger) -> ToolDeniedResponse {
    let action_kind = request.action_kind();
    let request_id = request.request_id().to_string();

    match trigger {
        DenialTrigger::BlockedPath {
            matched_pattern,
            target_summary,
        } => {
            let (reason, risk_category, user_instructions, checklist) =
                if matched_pattern.contains(".ssh") || matched_pattern.contains("Keychains") {
                    (
                        "Credential-bearing paths are blocked by tenra Guardrail policy.".to_string(),
                        DenialRiskCategory::Secrets,
                        "Inspect that credential path manually outside the agent runtime. If you need diagnostics, copy only non-secret material into an approved project path first.".to_string(),
                        vec![
                            "Confirm the target path does not contain secrets or credentials.".to_string(),
                            "Use a manual local check for keychain or SSH material.".to_string(),
                            "Retry only with a non-secret file inside an allowed read root.".to_string(),
                        ],
                    )
                } else {
                    (
                        "Secret-bearing environment files are blocked by tenra Guardrail policy.".to_string(),
                        DenialRiskCategory::Secrets,
                        "Do not expose environment files to the agent. Review the file manually and surface only the minimum safe values yourself.".to_string(),
                        vec![
                            "Confirm the request does not target a secret file.".to_string(),
                            "Move any non-sensitive diagnostics into an approved project path.".to_string(),
                            "Retry with a safe file under the project root.".to_string(),
                        ],
                    )
                };

            ToolDeniedResponse {
                status: "denied",
                request_id,
                action_kind,
                reason,
                risk_category,
                user_instructions,
                checklist,
                policy_rule: format!("deny-blocked-path:{matched_pattern}"),
                target_summary,
            }
        }
        DenialTrigger::ProtectedPath {
            matched_pattern,
            target_summary,
        } => ToolDeniedResponse {
            status: "denied",
            request_id,
            action_kind,
            reason: "Protected paths require explicit approval and are not accessible in the current runtime.".to_string(),
            risk_category: DenialRiskCategory::ProtectedPath,
            user_instructions: "Stay within normal project files or use an approved access path before retrying.".to_string(),
            checklist: vec![
                "Confirm the target is not part of a protected runtime path.".to_string(),
                "Use a standard project file instead of internal repository metadata.".to_string(),
                "Do not attempt to bypass the Tool Host boundary.".to_string(),
            ],
            policy_rule: format!("deny-protected-path:{matched_pattern}"),
            target_summary,
        },
        DenialTrigger::OutsideReadRoots { target_summary } => ToolDeniedResponse {
            status: "denied",
            request_id,
            action_kind,
            reason: "Read access is denied because the target is outside the configured project and read roots.".to_string(),
            risk_category: DenialRiskCategory::Filesystem,
            user_instructions: "Retry with a file inside a trusted project root or expand policy intentionally in config before trying again.".to_string(),
            checklist: vec![
                "Confirm the file lives inside a declared project root.".to_string(),
                "Check the allowed read roots in the loaded policy.".to_string(),
                "Use manual inspection for anything outside trusted scope.".to_string(),
            ],
            policy_rule: "deny-read-outside-roots".to_string(),
            target_summary,
        },
        DenialTrigger::OutsideWriteRoots { target_summary } => ToolDeniedResponse {
            status: "denied",
            request_id,
            action_kind,
            reason: "Write access is denied because the target is outside the configured project and write roots.".to_string(),
            risk_category: DenialRiskCategory::Filesystem,
            user_instructions: "Write only inside trusted project scope. If broader write access is needed, change policy explicitly instead of bypassing the boundary.".to_string(),
            checklist: vec![
                "Confirm the destination is inside a declared write root.".to_string(),
                "Prefer project-local scratch files for agent output.".to_string(),
                "Do not redirect writes to arbitrary system locations.".to_string(),
            ],
            policy_rule: "deny-write-outside-roots".to_string(),
            target_summary,
        },
        DenialTrigger::DangerousShellCommand {
            matched_pattern,
            target_summary,
        } => ToolDeniedResponse {
            status: "denied",
            request_id,
            action_kind: ToolRequestKind::ShellCommand,
            reason: "Destructive or privileged shell commands are blocked by tenra Guardrail policy.".to_string(),
            risk_category: DenialRiskCategory::Shell,
            user_instructions: "Run destructive maintenance manually outside the agent runtime if it is truly required, or replace it with a safer local diagnostic.".to_string(),
            checklist: vec![
                "Remove destructive or privileged shell fragments from the request.".to_string(),
                "Prefer read-only diagnostics over state-changing commands.".to_string(),
                "Keep shell execution outside the agent boundary for now.".to_string(),
            ],
            policy_rule: format!("deny-shell-command:{matched_pattern}"),
            target_summary,
        },
        DenialTrigger::ShellExecutionDisabled { target_summary } => ToolDeniedResponse {
            status: "denied",
            request_id,
            action_kind: ToolRequestKind::ShellCommand,
            reason: "Shell execution is not enabled in the current tenra Guardrail runtime.".to_string(),
            risk_category: DenialRiskCategory::Shell,
            user_instructions: "Use the file boundary for safe reads and writes. Leave shell operations to explicit human control until a stricter approval path exists.".to_string(),
            checklist: vec![
                "Avoid shell execution from the agent in the current runtime.".to_string(),
                "Use project-local file inspection instead.".to_string(),
                "Use an approved shell pathway only after policy enables it.".to_string(),
            ],
            policy_rule: "deny-shell-disabled".to_string(),
            target_summary,
        },
        DenialTrigger::NetworkDisabled { target_summary } => ToolDeniedResponse {
            status: "denied",
            request_id,
            action_kind: ToolRequestKind::NetworkRequest,
            reason: "Network-capable tooling is disabled in the current tenra Guardrail policy and runtime.".to_string(),
            risk_category: DenialRiskCategory::Network,
            user_instructions: "Do not route network access through the agent while this policy is disabled. Fetch the data manually or change policy intentionally before retrying.".to_string(),
            checklist: vec![
                "Confirm network access is actually required.".to_string(),
                "Use a manual fetch path outside the agent runtime for now.".to_string(),
                "Keep network tooling disabled by default.".to_string(),
            ],
            policy_rule: "deny-network-disabled".to_string(),
            target_summary,
        },
    }
}

pub fn build_execution_failure(
    request: &ToolRequest,
    target_summary: String,
    detail: String,
) -> ToolDeniedResponse {
    ToolDeniedResponse {
        status: "denied",
        request_id: request.request_id().to_string(),
        action_kind: request.action_kind(),
        reason: "The request passed boundary checks but the local operation still failed.".to_string(),
        risk_category: DenialRiskCategory::Filesystem,
        user_instructions: "Check that the path exists and is writable locally before retrying. tenra Guardrail will not guess around missing files or broken paths.".to_string(),
        checklist: vec![
            "Confirm the target path exists.".to_string(),
            "Verify local permissions manually.".to_string(),
            "Retry only after the filesystem issue is understood.".to_string(),
        ],
        policy_rule: format!("execution-failed:{detail}"),
        target_summary,
    }
}
