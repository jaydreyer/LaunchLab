import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePracticeStore } from "@/stores/practiceStore";
import {
  type ReadinessResponse,
  type FailureTheme,
  getReadiness,
  exportReadinessReport,
} from "@/api/dashboard";
import {
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

const LEVEL_LABELS: Record<string, string> = {
  ready_for_pilot: "Ready for Pilot",
  ready_for_limited_pilot: "Ready for Limited Pilot",
  needs_work: "Needs Work",
  not_ready: "Not Ready",
};

function normalizeLevel(raw: string): string {
  return LEVEL_LABELS[raw] ?? raw;
}

export default function ReadinessDashboard() {
  const practice = usePracticeStore((s) => s.practice);
  const fetchPractice = usePracticeStore((s) => s.fetchCurrent);

  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!practice) fetchPractice();
  }, [practice, fetchPractice]);

  useEffect(() => {
    if (!practice) return;
    loadReadiness(practice.id);
  }, [practice]);

  async function loadReadiness(practiceId: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getReadiness(practiceId);
      setReadiness(data);
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 404) {
        setReadiness(null);
      } else {
        setError("Failed to load readiness data.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!practice) return;
    setExporting(true);
    try {
      const markdown = await exportReadinessReport(practice.id);
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "readiness-report.md";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded.");
    } catch {
      toast.error("Failed to export report.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Launch Readiness"
        description="Overall readiness score, category breakdowns, failure themes, and exportable launch reports."
        actions={
          readiness ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1 h-4 w-4" />
              )}
              Export Report
            </Button>
          ) : undefined
        }
      />

      {loading && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-2">Loading readiness data...</p>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && !readiness && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <p>
            No eval runs completed yet. Run an evaluation suite first to see
            readiness results.
          </p>
          <Link to="/evals" className="mt-3 inline-block">
            <Button size="sm" variant="outline">
              <ArrowRight className="mr-1 h-4 w-4" />
              Go to Eval Runner
            </Button>
          </Link>
        </div>
      )}

      {!loading && readiness && (
        <div className="space-y-6">
          {/* Top section — Score + Recommendation */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ScoreGauge
              score={readiness.overall_score}
              level={normalizeLevel(readiness.readiness_level)}
            />
            <Card className="p-6 md:col-span-2">
              <div className="flex items-start gap-3">
                <ReadinessIcon
                  level={normalizeLevel(readiness.readiness_level)}
                />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {normalizeLevel(readiness.readiness_level)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {readiness.recommendation}
                  </p>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span>
                      {readiness.pass_count}/{readiness.scenario_count}{" "}
                      scenarios passed
                    </span>
                    <span>
                      Run:{" "}
                      {new Date(readiness.eval_run_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Middle — Category breakdown */}
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">
              Category Breakdown
            </h3>
            <div className="space-y-4">
              {readiness.category_scores.map((cat) => (
                <CategoryRow key={cat.category} category={cat} />
              ))}
            </div>
          </Card>

          {/* Bottom — Failure themes + Constraints */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {readiness.failure_themes.length > 0 && (
              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">
                  Failure Themes
                </h3>
                <div className="space-y-3">
                  {readiness.failure_themes.map((theme, i) => (
                    <ThemeCard key={i} theme={theme} />
                  ))}
                </div>
              </Card>
            )}

            {readiness.constraints.length > 0 && (
              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">
                  Deployment Constraints
                </h3>
                <ul className="space-y-2">
                  {readiness.constraints.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      {c}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {readiness.failure_themes.length === 0 &&
              readiness.constraints.length === 0 && (
                <Card className="p-6 md:col-span-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      No failure themes or constraints detected. All categories
                      performing well.
                    </span>
                  </div>
                </Card>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreGauge({ score, level }: { score: number; level: string }) {
  const color = levelColor(level);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="flex flex-col items-center justify-center p-6">
      <div className="relative h-32 w-32">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <ReadinessBadge level={level} className="mt-3" />
    </Card>
  );
}

function ReadinessIcon({ level }: { level: string }) {
  if (level === "Ready for Pilot") {
    return (
      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
    );
  }
  if (level === "Ready for Limited Pilot") {
    return <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />;
  }
  if (level === "Needs Work") {
    return <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />;
  }
  return <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />;
}

function ReadinessBadge({
  level,
  className = "",
}: {
  level: string;
  className?: string;
}) {
  const colorClasses = {
    "Ready for Pilot":
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Ready for Limited Pilot":
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Needs Work":
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Not Ready": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const cls =
    colorClasses[level as keyof typeof colorClasses] ??
    "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls} ${className}`}
    >
      {level}
    </span>
  );
}

function levelColor(level: string): string {
  if (level === "Ready for Pilot") return "text-emerald-500";
  if (level === "Ready for Limited Pilot") return "text-amber-500";
  if (level === "Needs Work") return "text-amber-500";
  return "text-destructive";
}

function CategoryRow({
  category,
}: {
  category: {
    category: string;
    pass_rate: number;
    avg_score: number;
    case_count: number;
    status: string;
  };
}) {
  const pct = Math.round(category.pass_rate * 100);
  const statusColor =
    category.status === "pass"
      ? "text-emerald-600 dark:text-emerald-400"
      : category.status === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-destructive";

  return (
    <div className="flex items-center gap-4">
      <div className="w-28 shrink-0">
        <span className="text-sm font-medium capitalize text-foreground">
          {category.category}
        </span>
        <span className="ml-1 text-xs text-muted-foreground">
          ({category.case_count})
        </span>
      </div>
      <div className="flex-1">
        <Progress value={pct} className="h-2" />
      </div>
      <div className="w-12 text-right">
        <span className={`text-sm font-semibold ${statusColor}`}>{pct}%</span>
      </div>
      <div className="w-16 text-right">
        <StatusBadge status={category.status} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pass") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-300 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
      >
        Pass
      </Badge>
    );
  }
  if (status === "warn") {
    return (
      <Badge
        variant="outline"
        className="border-amber-300 text-amber-600 dark:border-amber-800 dark:text-amber-400"
      >
        Warn
      </Badge>
    );
  }
  return <Badge variant="destructive">Fail</Badge>;
}

function ThemeCard({ theme }: { theme: FailureTheme }) {
  const severityColor =
    theme.severity === "critical"
      ? "text-destructive"
      : theme.severity === "high"
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {theme.theme}
        </span>
        <span className={`text-xs font-medium uppercase ${severityColor}`}>
          {theme.severity} ({theme.count})
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {theme.affected_scenarios.map((s) => (
          <Badge key={s} variant="secondary" className="text-[10px]">
            {s
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}
          </Badge>
        ))}
      </div>
    </div>
  );
}
