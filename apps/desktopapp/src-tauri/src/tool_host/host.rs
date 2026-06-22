use std::fs;

use crate::{
    policy::{
        evaluator::{evaluate_request, AllowedAction, EvaluationOutcome},
        model::GuardrailPolicy,
    },
    tool_host::{
        denial::{build_denial_payload, build_execution_failure},
        model::{ToolAllowedResponse, ToolExecutionResponse, ToolRequest},
    },
};

pub struct ToolHost {
    policy: GuardrailPolicy,
}

impl ToolHost {
    pub fn new(policy: GuardrailPolicy) -> Self {
        Self { policy }
    }

    // Execution safety boundary
    pub fn handle(&self, request: ToolRequest) -> ToolExecutionResponse {
        // All agent capabilities must cross this boundary before any local operation happens.
        match evaluate_request(&self.policy, &request) {
            EvaluationOutcome::Allowed(allowed) => self.execute_allowed(request, allowed),
            EvaluationOutcome::Denied(trigger) => {
                ToolExecutionResponse::Denied(build_denial_payload(&request, trigger))
            }
        }
    }

    // Local operation boundary
    fn execute_allowed(
        &self,
        request: ToolRequest,
        allowed: AllowedAction,
    ) -> ToolExecutionResponse {
        match allowed {
            AllowedAction::ReadFile {
                resolved_path,
                target_summary,
            } => match fs::read(&resolved_path) {
                Ok(bytes) => ToolExecutionResponse::Allowed(ToolAllowedResponse {
                    status: "allowed",
                    request_id: request.request_id().to_string(),
                    action_kind: request.action_kind(),
                    summary: format!("Read allowed for {}", target_summary),
                    output_preview: Some(preview_bytes(&bytes)),
                }),
                Err(error) => ToolExecutionResponse::Denied(build_execution_failure(
                    &request,
                    target_summary,
                    error.to_string(),
                )),
            },
            AllowedAction::WriteFile {
                resolved_path,
                target_summary,
            } => match request.write_contents() {
                Some(contents) => match fs::write(&resolved_path, contents) {
                    Ok(()) => ToolExecutionResponse::Allowed(ToolAllowedResponse {
                        status: "allowed",
                        request_id: request.request_id().to_string(),
                        action_kind: request.action_kind(),
                        summary: format!("Write allowed for {}", target_summary),
                        output_preview: None,
                    }),
                    Err(error) => ToolExecutionResponse::Denied(build_execution_failure(
                        &request,
                        target_summary,
                        error.to_string(),
                    )),
                },
                None => ToolExecutionResponse::Denied(build_execution_failure(
                    &request,
                    target_summary,
                    "missing write contents".to_string(),
                )),
            },
        }
    }
}

// Response preview boundary
fn preview_bytes(bytes: &[u8]) -> String {
    let preview = String::from_utf8_lossy(bytes);
    let mut truncated = preview.chars().take(180).collect::<String>();
    if preview.chars().count() > 180 {
        truncated.push_str("...");
    }
    truncated
}

// Policy fixture boundary
#[cfg(test)]
mod tests {
    use std::{
        fs,
        path::PathBuf,
        time::{SystemTime, UNIX_EPOCH},
    };

    use crate::{
        policy::model::GuardrailPolicy,
        tool_host::model::{RequestContext, RuntimeSurface, ToolExecutionResponse, ToolRequest},
    };

    use super::ToolHost;

    #[test]
    fn cannot_read_ssh_material() {
        let fixture = TestFixture::new();
        let request = ToolRequest::ReadFile {
            context: fixture.context("read-ssh"),
            path: fixture.home_ssh_file.display().to_string(),
        };

        let response = fixture.host.handle(request);

        assert_denied(response, "deny-blocked-path:.ssh", "secrets");
    }

    #[test]
    fn cannot_read_blocked_env_file() {
        let fixture = TestFixture::new();
        let request = ToolRequest::ReadFile {
            context: fixture.context("read-env"),
            path: fixture.env_file.display().to_string(),
        };

        let response = fixture.host.handle(request);

        assert_denied(response, "deny-blocked-path:.env", "secrets");
    }

    #[test]
    fn cannot_write_outside_project_root() {
        let fixture = TestFixture::new();
        let request = ToolRequest::WriteFile {
            context: fixture.context("write-outside"),
            path: fixture.outside_file.display().to_string(),
            contents: "unsafe".to_string(),
        };

        let response = fixture.host.handle(request);

        assert_denied(response, "deny-write-outside-roots", "filesystem");
    }

    #[test]
    fn cannot_execute_rm_rf() {
        let fixture = TestFixture::new();
        let request = ToolRequest::ShellCommand {
            context: fixture.context("rm-rf"),
            command: "rm -rf /tmp/guardrail".to_string(),
            working_directory: None,
        };

        let response = fixture.host.handle(request);

        assert_denied(response, "deny-shell-command:rm -rf", "shell");
    }

    #[test]
    fn cannot_use_network_when_disabled() {
        let fixture = TestFixture::new();
        let request = ToolRequest::NetworkRequest {
            context: fixture.context("network"),
            method: "GET".to_string(),
            url: "https://api.openai.com/v1/models".to_string(),
        };

        let response = fixture.host.handle(request);

        assert_denied(response, "deny-network-disabled", "network");
    }

    #[test]
    fn denials_are_structured_and_deterministic() {
        let fixture = TestFixture::new();
        let request = ToolRequest::NetworkRequest {
            context: fixture.context("deterministic"),
            method: "GET".to_string(),
            url: "https://example.com".to_string(),
        };

        let first = fixture.host.handle(request.clone());
        let second = fixture.host.handle(request);

        assert_eq!(first, second);
    }

    fn assert_denied(response: ToolExecutionResponse, expected_rule: &str, expected_risk: &str) {
        match response {
            ToolExecutionResponse::Denied(payload) => {
                assert_eq!(payload.status, "denied");
                assert_eq!(payload.policy_rule, expected_rule);
                assert_eq!(serde_json::to_value(payload.risk_category).unwrap(), expected_risk);
                assert!(!payload.reason.is_empty());
                assert!(!payload.user_instructions.is_empty());
                assert!(!payload.checklist.is_empty());
            }
            ToolExecutionResponse::Allowed(_) => panic!("request unexpectedly allowed"),
        }
    }

    struct TestFixture {
        host: ToolHost,
        _root: PathBuf,
        home_ssh_file: PathBuf,
        env_file: PathBuf,
        outside_file: PathBuf,
    }

    impl TestFixture {
        fn new() -> Self {
            let root = unique_temp_dir("runtime-spine");
            let project_root = root.join("project");
            let outside_root = root.join("outside");
            let home_root = root.join("home");
            let ssh_dir = home_root.join(".ssh");

            fs::create_dir_all(&project_root).unwrap();
            fs::create_dir_all(&outside_root).unwrap();
            fs::create_dir_all(&ssh_dir).unwrap();

            let env_file = project_root.join(".env");
            let home_ssh_file = ssh_dir.join("id_ed25519");
            let outside_file = outside_root.join("output.txt");

            fs::write(project_root.join("README.md"), "safe").unwrap();
            fs::write(&env_file, "SECRET=1").unwrap();
            fs::write(&home_ssh_file, "PRIVATE KEY").unwrap();

            let policy = GuardrailPolicy {
                project_roots: vec![project_root.display().to_string()],
                denied_paths: vec![".ssh".to_string(), ".env".to_string()],
                allowed_read_roots: vec![project_root.display().to_string()],
                allowed_write_roots: vec![project_root.display().to_string()],
                denied_shell_commands: vec!["rm -rf".to_string()],
                network_enabled: false,
                protected_paths: vec![".git".to_string()],
            };

            Self {
                host: ToolHost::new(policy),
                _root: root,
                home_ssh_file,
                env_file,
                outside_file,
            }
        }

        fn context(&self, id: &str) -> RequestContext {
            RequestContext {
                id: id.to_string(),
                project_id: "test-project".to_string(),
                requested_at: "123".to_string(),
                surface: RuntimeSurface::Desktop,
            }
        }
    }

    fn unique_temp_dir(label: &str) -> PathBuf {
        let unique_id = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let directory = std::env::temp_dir().join(format!(
            "guardrail-{label}-{}-{unique_id}",
            std::process::id()
        ));
        fs::create_dir_all(&directory).unwrap();
        directory
    }
}
