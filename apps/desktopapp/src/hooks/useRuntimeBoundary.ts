import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  RuntimeBoundarySnapshot,
  RuntimeOverview,
  ToolExecutionResponse,
  ToolRequest
} from "@guardrail/runtime-contracts";
import {
  fallbackBoundarySnapshot,
  fallbackOverview,
  suiteClientNavigation
} from "../guardrailData";

export function useRuntimeBoundary() {
  const [overview, setOverview] = useState<RuntimeOverview>(fallbackOverview);
  const [boundarySnapshot, setBoundarySnapshot] = useState<RuntimeBoundarySnapshot>(
    fallbackBoundarySnapshot
  );
  const [runtimeSource, setRuntimeSource] = useState<"rust" | "fallback">("fallback");
  const [activeSection, setActiveSection] = useState(suiteClientNavigation[0].id);
  const [selectedRequestId, setSelectedRequestId] = useState(
    fallbackBoundarySnapshot.sampleRequests[0]?.id ?? ""
  );
  const [lastResult, setLastResult] = useState<ToolExecutionResponse | null>(null);
  const [requestRunning, setRequestRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      invoke<RuntimeOverview>("get_runtime_overview"),
      invoke<RuntimeBoundarySnapshot>("get_runtime_boundary_snapshot")
    ])
      .then(([runtimeOverview, snapshot]) => {
        if (cancelled) {
          return;
        }

        setOverview(runtimeOverview);
        setBoundarySnapshot(snapshot);
        setSelectedRequestId(snapshot.sampleRequests[0]?.id ?? "");
        setRuntimeSource("rust");
      })
      .catch(() => {
        if (!cancelled) {
          setOverview(fallbackOverview);
          setBoundarySnapshot(fallbackBoundarySnapshot);
          setSelectedRequestId(fallbackBoundarySnapshot.sampleRequests[0]?.id ?? "");
          setRuntimeSource("fallback");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRequest = useMemo(
    () =>
      boundarySnapshot.sampleRequests.find((request) => request.id === selectedRequestId) ??
      boundarySnapshot.sampleRequests[0] ??
      null,
    [boundarySnapshot.sampleRequests, selectedRequestId]
  );

  const auditEntries = useMemo(
    () => [...boundarySnapshot.auditEntries].slice(-5).reverse(),
    [boundarySnapshot.auditEntries]
  );

  async function runRequest(request: ToolRequest) {
    if (runtimeSource !== "rust") {
      return;
    }

    setRequestRunning(true);
    setSelectedRequestId(request.id);

    try {
      const [result, runtimeOverview, snapshot] = await Promise.all([
        invoke<ToolExecutionResponse>("run_tool_request", { request }),
        invoke<RuntimeOverview>("get_runtime_overview"),
        invoke<RuntimeBoundarySnapshot>("get_runtime_boundary_snapshot")
      ]);

      setLastResult(result);
      setOverview(runtimeOverview);
      setBoundarySnapshot(snapshot);
    } finally {
      setRequestRunning(false);
    }
  }

  function exportRuntimeSnapshot() {
    const payload = {
      auditEntries: boundarySnapshot.auditEntries,
      boundarySnapshot,
      exportedAt: new Date().toISOString(),
      lastResult,
      overview,
      runtimeSource,
      schema: "tenra-guardrail-runtime-snapshot:v1"
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `tenra-guardrail-runtime-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    activeSection,
    auditEntries,
    boundarySnapshot,
    exportRuntimeSnapshot,
    lastResult,
    overview,
    requestRunning,
    runRequest,
    runtimeSource,
    selectedRequest,
    selectedRequestId,
    setActiveSection
  };
}
