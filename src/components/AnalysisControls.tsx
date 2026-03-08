import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export type AnalysisMode = "dc" | "transient" | "ac";

export interface TransientParams {
  tStart: number;
  tEnd: number;
  dt: number;
}

export interface AcParams {
  startFreq: number;
  endFreq: number;
  numPoints: number;
  logScale: boolean;
}

interface AnalysisControlsProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  transientParams: TransientParams;
  onTransientParamsChange: (p: TransientParams) => void;
  acParams: AcParams;
  onAcParamsChange: (p: AcParams) => void;
  onRun: () => void;
  isRunning: boolean;
}

export function AnalysisControls({
  mode, onModeChange, transientParams, onTransientParamsChange,
  acParams, onAcParamsChange, onRun, isRunning,
}: AnalysisControlsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Analysis Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as AnalysisMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="dc" className="flex-1">DC</TabsTrigger>
            <TabsTrigger value="transient" className="flex-1">Transient</TabsTrigger>
            <TabsTrigger value="ac" className="flex-1">AC Sweep</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "transient" && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Start (s)</Label>
              <Input type="number" value={transientParams.tStart} step={0.0001}
                onChange={e => onTransientParamsChange({ ...transientParams, tStart: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label className="text-xs">End (s)</Label>
              <Input type="number" value={transientParams.tEnd} step={0.001}
                onChange={e => onTransientParamsChange({ ...transientParams, tEnd: parseFloat(e.target.value) || 0.01 })} />
            </div>
            <div>
              <Label className="text-xs">Step (s)</Label>
              <Input type="number" value={transientParams.dt} step={0.00001}
                onChange={e => onTransientParamsChange({ ...transientParams, dt: parseFloat(e.target.value) || 0.00001 })} />
            </div>
          </div>
        )}

        {mode === "ac" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Freq (Hz)</Label>
                <Input type="number" value={acParams.startFreq}
                  onChange={e => onAcParamsChange({ ...acParams, startFreq: parseFloat(e.target.value) || 1 })} />
              </div>
              <div>
                <Label className="text-xs">End Freq (Hz)</Label>
                <Input type="number" value={acParams.endFreq}
                  onChange={e => onAcParamsChange({ ...acParams, endFreq: parseFloat(e.target.value) || 100000 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Points</Label>
                <Input type="number" value={acParams.numPoints}
                  onChange={e => onAcParamsChange({ ...acParams, numPoints: parseInt(e.target.value) || 100 })} />
              </div>
              <div className="flex items-end">
                <Button
                  variant={acParams.logScale ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => onAcParamsChange({ ...acParams, logScale: !acParams.logScale })}
                >
                  {acParams.logScale ? "Log Scale ✓" : "Linear Scale"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <Button className="w-full" size="lg" onClick={onRun} disabled={isRunning}>
          {isRunning ? "Analyzing…" : `Run ${mode.toUpperCase()} Analysis`}
        </Button>
      </CardContent>
    </Card>
  );
}
