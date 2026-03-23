import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePracticeStore } from "@/stores/practiceStore";
import { useAgentConfigStore } from "@/stores/agentConfigStore";
import {
  type EvalRunResponse,
  type EvalRunSummary,
  type EvalCaseResponse,
  startEvalRun,
  getEvalRun,
  listEvalRuns,
} from "@/api/evals";
import { type ScenarioSummary, listScenarios } from "@/api/scenarios";
import {
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router";

type FilterStatus = "all" | "pass" | "fail";

export default function EvalRunner() {
  const practice = usePracticeStore((s) => s.practice);
  const fetchPractice = usePracticeStore((s) => s.fetchCurrent);
  const config = useAgentConfigStore((s) => s.config);
  const fetchConfig = useAgentConfigStore((s) => s.fetchCurrent);

  const [, setRuns] = useState<EvalRunSummary[]>([]);
  const [currentRun, setCurrentRun] = useState<EvalRunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [scenarioMap, setScenarioMap] = useState<Record<string, string>>({});

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!practice) fetchPractice();
    if (!config) fetchConfig();
    loadRuns();
    listScenarios()
      .then((scenarios: ScenarioSummary[]) => {
        const map: Record<string, string> = {};
        for (const s of scenarios) map[s.name] = s.category;
        setScenarioMap(map);
      })
      .catch(() => {});
  }, [practice, config, fetchPractice, fetchConfig]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function loadRuns() {
    try {
      const data = await listEvalRuns();
      setRuns(data);
      // Load the most recent completed run with full details
      const latestCompleted = data.find((r) => r.status === "completed");
      if (latestCompleted) {
        const full = await getEvalRun(latestCompleted.id);
        setCurrentRun(full);
      }
    } catch {
      // Ignore — empty state will show
    } finally {
      setLoading(false);
    }
  }

  const pollForCompletion = useCallback((runId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const run = await getEvalRun(runId);
        if (run.status === "completed" || run.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setCurrentRun(run);
          setRunning(false);
          const data = await listEvalRuns();
          setRuns(data);
          if (run.status === "completed") {
            toast.success("Eval suite completed!");
          } else {
            toast.error("Eval suite failed.");
          }
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 4000);
  }, []);

  async function handleRunEvals() {
    if (!practice || !config) {
      toast.error("Load a practice and agent config first.");
      return;
    }
    setRunning(true);
    setCurrentRun(null);
    setExpandedCases(new Set());
    try {
      const run = await startEvalRun({
        practice_id: practice.id,
        config_id: config.id,
        suite_name: "v1",
      });
      toast.info("Eval suite started — this may take a few minutes.");
      pollForCompletion(run.id);
    } catch {
      toast.error("Failed to start eval run.");
      setRunning(false);
    }
  }

  function toggleCase(caseId: string) {
    setExpandedCases((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  }

  const filteredCases = currentRun?.cases.filter((c) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pass") return c.passed === true;
    return c.passed === false;
  });

  const passCount =
    currentRun?.cases.filter((c) => c.passed === true).length ?? 0;
  const failCount =
    currentRun?.cases.filter((c) => c.passed === false).length ?? 0;
  const totalCases = currentRun?.cases.length ?? 0;

  const needsSetup = !practice || !config;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Eval Runner"
        description="Run the evaluation suite against the current agent configuration and review results."
        actions={
          <Button
            size="sm"
            onClick={handleRunEvals}
            disabled={running || needsSetup}
          >
            {running ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-1 h-4 w-4" />
            )}
            {running ? "Running..." : "Run Evals"}
          </Button>
        }
      />

      {running && <RunningIndicator />}

      {!running && needsSetup && (
        <EmptyCard message="Set up a practice profile and agent config before running evaluations." />
      )}

      {!running && !needsSetup && loading && (
        <EmptyCard message="Loading eval runs..." />
      )}

      {!running && !needsSetup && !loading && !currentRun && (
        <EmptyCard message="No eval runs yet. Click Run Evals to start your first evaluation suite." />
      )}

      {!running && currentRun && (
        <>
          {/* Summary bar */}
          <SummaryBar
            run={currentRun}
            passCount={passCount}
            failCount={failCount}
            totalCases={totalCases}
          />

          {/* Filter tabs */}
          <div className="mt-4 flex items-center gap-2">
            <FilterButton
              label="All"
              count={totalCases}
              active={filterStatus === "all"}
              onClick={() => setFilterStatus("all")}
            />
            <FilterButton
              label="Passed"
              count={passCount}
              active={filterStatus === "pass"}
              onClick={() => setFilterStatus("pass")}
            />
            <FilterButton
              label="Failed"
              count={failCount}
              active={filterStatus === "fail"}
              onClick={() => setFilterStatus("fail")}
            />
          </div>

          {/* Results table */}
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Scenario</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Result</TableHead>
                  <TableHead className="hidden md:table-cell text-center">
                    Trace
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases?.map((c) => (
                  <CaseRow
                    key={c.id}
                    evalCase={c}
                    category={scenarioMap[c.scenario_name] ?? "—"}
                    expanded={expandedCases.has(c.id)}
                    onToggle={() => toggleCase(c.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function RunningIndicator() {
  return (
    <Card className="flex flex-col items-center gap-4 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center">
        <p className="font-medium text-foreground">
          Running evaluation suite...
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Executing 10 scenarios with the patient simulator and judge. This
          typically takes 2-4 minutes.
        </p>
      </div>
      <Progress value={null} className="w-64" />
    </Card>
  );
}

function SummaryBar({
  run,
  passCount,
  failCount,
  totalCases,
}: {
  run: EvalRunResponse;
  passCount: number;
  failCount: number;
  totalCases: number;
}) {
  const passRate = totalCases > 0 ? (passCount / totalCases) * 100 : 0;
  const totalScore = run.summary?.overall_score ?? run.summary?.total_score;
  const completedAt = run.completed_at
    ? new Date(run.completed_at).toLocaleString()
    : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Pass Rate
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {passRate.toFixed(0)}%
        </p>
        <p className="text-xs text-muted-foreground">
          {passCount}/{totalCases} scenarios
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Avg Score
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {totalScore != null ? (totalScore * 100).toFixed(0) : "—"}
        </p>
        <p className="text-xs text-muted-foreground">weighted average</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Failed
        </p>
        <p
          className={`mt-1 text-2xl font-bold ${failCount > 0 ? "text-destructive" : "text-foreground"}`}
        >
          {failCount}
        </p>
        <p className="text-xs text-muted-foreground">scenarios</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Completed
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {completedAt ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">suite: {run.suite_name}</p>
      </Card>
    </div>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function scenarioLabel(name: string): string {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function CaseRow({
  evalCase,
  category,
  expanded,
  onToggle,
}: {
  evalCase: EvalCaseResponse;
  category: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const score =
    evalCase.score != null ? (evalCase.score * 100).toFixed(0) : "—";

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell className="w-8">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-medium">
          {scenarioLabel(evalCase.scenario_name)}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <Badge variant="outline" className="capitalize">
            {category}
          </Badge>
        </TableCell>
        <TableCell className="text-center">{score}</TableCell>
        <TableCell className="text-center">
          <PassFailBadge passed={evalCase.passed} />
        </TableCell>
        <TableCell className="hidden md:table-cell text-center">
          {evalCase.session_id && (
            <Link
              to={`/simulations/${evalCase.session_id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30 p-0">
            <CaseDetails evalCase={evalCase} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function PassFailBadge({ passed }: { passed: boolean | null }) {
  if (passed === true) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Pass
      </span>
    );
  }
  if (passed === false) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <XCircle className="h-3.5 w-3.5" />
        Fail
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

function CaseDetails({ evalCase }: { evalCase: EvalCaseResponse }) {
  const criteria = evalCase.criteria_results;
  const failureReasons = evalCase.failure_reasons;

  return (
    <div className="space-y-4 px-6 py-4">
      {/* Criteria results */}
      {criteria && Object.keys(criteria).length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Criteria Results
          </h4>
          <div className="space-y-2">
            {Object.entries(criteria).map(([key, val]) => (
              <div key={key} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {val.description || key.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">
                      {val.category?.replace(/_/g, " ") ?? ""}
                    </span>
                    <PassFailBadge passed={val.passed} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {val.reasoning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failure reasons */}
      {failureReasons &&
        Array.isArray(failureReasons) &&
        failureReasons.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Failure Reasons
            </h4>
            <div className="space-y-1">
              {(failureReasons as unknown as string[]).map((reason, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-destructive"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Link to trace */}
      {evalCase.session_id && (
        <Link
          to={`/simulations/${evalCase.session_id}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View full simulation trace
        </Link>
      )}
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
      {message}
    </div>
  );
}
