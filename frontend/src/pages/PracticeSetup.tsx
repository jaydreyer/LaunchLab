import { useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/practice/SectionCard";
import { LocationsSection } from "@/components/practice/LocationsSection";
import { ProvidersSection } from "@/components/practice/ProvidersSection";
import { HoursSection } from "@/components/practice/HoursSection";
import { AppointmentTypesSection } from "@/components/practice/AppointmentTypesSection";
import { InsuranceRulesSection } from "@/components/practice/InsuranceRulesSection";
import { EscalationRulesSection } from "@/components/practice/EscalationRulesSection";
import { usePracticeStore } from "@/stores/practiceStore";
import { Loader2, RotateCcw, Save, Sparkles } from "lucide-react";
import type { Practice, PracticeUpdate } from "@/api/practices";

export default function PracticeSetup() {
  const {
    practice,
    loading,
    saving,
    error,
    fetchCurrent,
    save,
    reset,
    loadSample,
    setPractice,
  } = usePracticeStore();

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  function updateField<K extends keyof PracticeUpdate>(
    field: K,
    value: Practice[K],
  ) {
    if (!practice) return;
    setPractice({ ...practice, [field]: value });
  }

  async function handleSave() {
    if (!practice) return;
    try {
      await save(practice.id, {
        name: practice.name,
        locations: practice.locations,
        providers: practice.providers,
        hours: practice.hours,
        appointment_types: practice.appointment_types,
        insurance_rules: practice.insurance_rules,
        escalation_rules: practice.escalation_rules,
      });
      toast.success("Practice saved successfully");
    } catch {
      toast.error("Failed to save practice");
    }
  }

  async function handleReset() {
    try {
      await reset();
      toast.success("Practice reset to defaults");
    } catch {
      toast.error("Failed to reset practice");
    }
  }

  async function handleLoadSample() {
    try {
      await loadSample();
      toast.success("BrightCare sample data loaded");
    } catch {
      toast.error("Failed to load sample data");
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Practice Setup"
          description="Configure the healthcare practice profile."
        />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!practice && !loading) {
    return (
      <div>
        <PageHeader
          title="Practice Setup"
          description="Configure the healthcare practice profile."
        />
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <p className="mb-4 text-muted-foreground">
            No practice configured yet. Load the BrightCare sample to get
            started.
          </p>
          <Button onClick={handleLoadSample} size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Load BrightCare Sample
          </Button>
        </div>
      </div>
    );
  }

  if (!practice) return null;

  const locationKeys = Object.keys(practice.locations);
  const appointmentTypeKeys = Object.keys(practice.appointment_types);

  return (
    <div>
      <PageHeader
        title="Practice Setup"
        description="Configure the healthcare practice profile — locations, providers, hours, insurance rules, and escalation policies."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              disabled={saving}
            >
              <Sparkles className="mr-1 h-4 w-4" />
              Load Sample
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <SectionCard title="Practice Name">
          <div className="max-w-md">
            <Label>Name</Label>
            <Input
              value={practice.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
        </SectionCard>

        <LocationsSection
          locations={practice.locations}
          onChange={(locations) => updateField("locations", locations)}
        />

        <ProvidersSection
          providers={practice.providers}
          locationKeys={locationKeys}
          appointmentTypeKeys={appointmentTypeKeys}
          onChange={(providers) => updateField("providers", providers)}
        />

        <HoursSection
          hours={practice.hours}
          locationKeys={locationKeys}
          onChange={(hours) => updateField("hours", hours)}
        />

        <AppointmentTypesSection
          appointmentTypes={practice.appointment_types}
          onChange={(types) => updateField("appointment_types", types)}
        />

        <InsuranceRulesSection
          rules={practice.insurance_rules}
          onChange={(rules) => updateField("insurance_rules", rules)}
        />

        <EscalationRulesSection
          rules={practice.escalation_rules}
          onChange={(rules) => updateField("escalation_rules", rules)}
        />
      </div>
    </div>
  );
}
