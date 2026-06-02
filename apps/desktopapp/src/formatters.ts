import type {
  ToolDeniedResponse,
  ToolExecutionResponse,
  ToolRequest
} from "@guardrail/runtime-contracts";

export function describeRequest(request: ToolRequest) {
  switch (request.kind) {
    case "read-file":
      return "Read file";
    case "write-file":
      return "Write file";
    case "shell-command":
      return "Shell command";
    case "network-request":
      return "Network request";
  }
}

export function describeTarget(request: ToolRequest) {
  switch (request.kind) {
    case "read-file":
    case "write-file":
      return request.path;
    case "shell-command":
      return request.command;
    case "network-request":
      return `${request.method} ${request.url}`;
  }
}

export function formatTimestamp(timestampMs: number) {
  return new Date(timestampMs).toLocaleString();
}

export function isDenied(
  response: ToolExecutionResponse
): response is ToolDeniedResponse {
  return response.status === "denied";
}
