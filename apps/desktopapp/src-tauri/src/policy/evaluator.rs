use std::path::{Component, Path, PathBuf};

use crate::{
    policy::model::GuardrailPolicy,
    tool_host::model::{ToolRequest, ToolRequestKind},
};

#[derive(Debug, PartialEq, Eq)]
pub enum EvaluationOutcome {
    Allowed(AllowedAction),
    Denied(DenialTrigger),
}

#[derive(Debug, PartialEq, Eq)]
pub enum AllowedAction {
    ReadFile {
        resolved_path: PathBuf,
        target_summary: String,
    },
    WriteFile {
        resolved_path: PathBuf,
        target_summary: String,
    },
}

#[derive(Debug, PartialEq, Eq)]
pub enum DenialTrigger {
    BlockedPath {
        matched_pattern: String,
        target_summary: String,
    },
    ProtectedPath {
        matched_pattern: String,
        target_summary: String,
    },
    OutsideReadRoots {
        target_summary: String,
    },
    OutsideWriteRoots {
        target_summary: String,
    },
    DangerousShellCommand {
        matched_pattern: String,
        target_summary: String,
    },
    ShellExecutionDisabled {
        target_summary: String,
    },
    NetworkDisabled {
        target_summary: String,
    },
}

// Request classification boundary
pub fn evaluate_request(policy: &GuardrailPolicy, request: &ToolRequest) -> EvaluationOutcome {
    match request {
        ToolRequest::ReadFile { path, .. } => {
            let resolved_path = resolve_request_path(policy, path);
            evaluate_path_access(
                policy,
                &resolved_path,
                &policy.allowed_read_roots,
                ToolRequestKind::ReadFile,
            )
        }
        ToolRequest::WriteFile { path, .. } => {
            let resolved_path = resolve_request_path(policy, path);
            evaluate_path_access(
                policy,
                &resolved_path,
                &policy.allowed_write_roots,
                ToolRequestKind::WriteFile,
            )
        }
        ToolRequest::ShellCommand { command, .. } => evaluate_shell(policy, command),
        ToolRequest::NetworkRequest { url, .. } => EvaluationOutcome::Denied(
            DenialTrigger::NetworkDisabled {
                target_summary: url.to_string(),
            },
        ),
    }
}

// Filesystem policy boundary
fn evaluate_path_access(
    policy: &GuardrailPolicy,
    target_path: &Path,
    allowed_roots: &[String],
    request_kind: ToolRequestKind,
) -> EvaluationOutcome {
    let target_summary = target_path.display().to_string();

    if let Some(pattern) = match_path_pattern(target_path, &policy.denied_paths) {
        return EvaluationOutcome::Denied(DenialTrigger::BlockedPath {
            matched_pattern: pattern,
            target_summary,
        });
    }

    if let Some(pattern) = match_path_pattern(target_path, &policy.protected_paths) {
        return EvaluationOutcome::Denied(DenialTrigger::ProtectedPath {
            matched_pattern: pattern,
            target_summary,
        });
    }

    if !path_within_roots(target_path, allowed_roots) {
        return EvaluationOutcome::Denied(match request_kind {
            ToolRequestKind::ReadFile => DenialTrigger::OutsideReadRoots { target_summary },
            ToolRequestKind::WriteFile => DenialTrigger::OutsideWriteRoots { target_summary },
            ToolRequestKind::ShellCommand | ToolRequestKind::NetworkRequest => {
                unreachable!("path evaluation only applies to file requests")
            }
        });
    }

    match request_kind {
        ToolRequestKind::ReadFile => EvaluationOutcome::Allowed(AllowedAction::ReadFile {
            resolved_path: target_path.to_path_buf(),
            target_summary,
        }),
        ToolRequestKind::WriteFile => EvaluationOutcome::Allowed(AllowedAction::WriteFile {
            resolved_path: target_path.to_path_buf(),
            target_summary,
        }),
        ToolRequestKind::ShellCommand | ToolRequestKind::NetworkRequest => {
            unreachable!("path evaluation only applies to file requests")
        }
    }
}

// Shell policy boundary
fn evaluate_shell(policy: &GuardrailPolicy, command: &str) -> EvaluationOutcome {
    let normalized_command = command.to_ascii_lowercase();

    if let Some(pattern) = policy
        .denied_shell_commands
        .iter()
        .find(|pattern| normalized_command.contains(&pattern.to_ascii_lowercase()))
    {
        return EvaluationOutcome::Denied(DenialTrigger::DangerousShellCommand {
            matched_pattern: pattern.to_string(),
            target_summary: command.to_string(),
        });
    }

    EvaluationOutcome::Denied(DenialTrigger::ShellExecutionDisabled {
        target_summary: command.to_string(),
    })
}

// Path normalization boundary
fn resolve_request_path(policy: &GuardrailPolicy, input: &str) -> PathBuf {
    if let Some(home_relative) = input.strip_prefix("~/") {
        return home_dir()
            .map(|home| normalize_path(&home.join(home_relative)))
            .unwrap_or_else(|| normalize_path(&PathBuf::from(input)));
    }

    let path = PathBuf::from(input);

    if path.is_absolute() {
        return normalize_path(&path);
    }

    let base = policy
        .project_roots
        .first()
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(env!("CARGO_MANIFEST_DIR")));

    normalize_path(&base.join(path))
}

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("USERPROFILE").map(PathBuf::from))
}

fn path_within_roots(target_path: &Path, roots: &[String]) -> bool {
    roots
        .iter()
        .map(PathBuf::from)
        .any(|root| target_path.starts_with(root))
}

// Pattern matching boundary
fn match_path_pattern(target_path: &Path, patterns: &[String]) -> Option<String> {
    patterns
        .iter()
        .find(|pattern| target_matches_pattern(target_path, pattern))
        .cloned()
}

fn target_matches_pattern(target_path: &Path, pattern: &str) -> bool {
    if let Some(home_relative) = pattern.strip_prefix("~/") {
        if let Some(home) = home_dir() {
            let expanded = normalize_path(&home.join(home_relative));
            return target_path == expanded || target_path.starts_with(expanded);
        }
    }

    let pattern_path = PathBuf::from(pattern);
    if pattern_path.is_absolute() {
        let normalized_pattern = normalize_path(&pattern_path);
        return target_path == normalized_pattern || target_path.starts_with(normalized_pattern);
    }

    let target_components = path_components(target_path);
    let pattern_components = path_components(&pattern_path);

    if pattern_components.is_empty() || pattern_components.len() > target_components.len() {
        return false;
    }

    target_components
        .windows(pattern_components.len())
        .any(|window| window == pattern_components.as_slice())
}

fn path_components(path: &Path) -> Vec<String> {
    path.components()
        .filter_map(|component| match component {
            Component::Prefix(_) | Component::RootDir | Component::CurDir | Component::ParentDir => {
                None
            }
            Component::Normal(value) => Some(value.to_string_lossy().to_string()),
        })
        .collect()
}

fn normalize_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();

    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            Component::RootDir | Component::Prefix(_) | Component::Normal(_) => {
                normalized.push(component.as_os_str());
            }
        }
    }

    normalized
}
