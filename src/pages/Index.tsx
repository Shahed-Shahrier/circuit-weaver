import { useState, useCallback } from "react";
import { CircuitInput } from "@/components/CircuitInput";
import { AnalysisControls, type AnalysisMode, type TransientParams, type AcParams } from "@/components/AnalysisControls";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ChartPanel } from "@/components/ChartPanel";
import { DocumentationPanel } from "@/components/DocumentationPanel";
import { parseNetlist } from "@/engine/parser";
import { runDcAnalysis, type DcResult } from "@/engine/dcAnalysis";
import { runTransientAnalysis, type TransientResult } from "@/engine/transientAnalysis";
import { runAcAnalysis, type AcResult } from "@/engine/acAnalysis";
import { Zap } from "lucide-react";

const Index = () => {
  const [netlist, setNetlist] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("dc");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dcResult, setDcResult] = useState<DcResult | null>(null);
  const [transientResult, setTransientResult] = useState<TransientResult | null>(null);
  const [acResult, setAcResult] = useState<AcResult | null>(null);

  const [transientParams, setTransientParams] = useState<TransientParams>({
    tStart: 0, tEnd: 0.005, dt: 0.000005,
  });
  const [acParams, setAcParams] = useState<AcParams>({
    startFreq: 10, endFreq: 100000, numPoints: 200, logScale: true,
  });

  const handleNetlistChange = useCallback((value: string) => {
    setNetlist(value);
    setParseErrors([]);
    setError(null);
  }, []);

  const handleRun = useCallback(() => {
    setError(null);
    setDcResult(null);
    setTransientResult(null);
    setAcResult(null);
    setIsRunning(true);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const parsed = parseNetlist(netlist);
        setParseErrors(parsed.errors);

        if (parsed.errors.length > 0) {
          setIsRunning(false);
          return;
        }

        if (parsed.components.length === 0) {
          setError("No components found. Enter a circuit netlist.");
          setIsRunning(false);
          return;
        }

        switch (analysisMode) {
          case "dc": {
            const result = runDcAnalysis(parsed.components, parsed.nodes);
            setDcResult(result);
            break;
          }
          case "transient": {
            const result = runTransientAnalysis(parsed.components, parsed.nodes, transientParams);
            setTransientResult(result);
            break;
          }
          case "ac": {
            const result = runAcAnalysis(parsed.components, parsed.nodes, acParams);
            setAcResult(result);
            break;
          }
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsRunning(false);
      }
    }, 50);
  }, [netlist, analysisMode, transientParams, acParams]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container max-w-7xl py-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Advanced Circuit Analyzer Tool</h1>
              <p className="text-sm text-muted-foreground">
                DC · Transient · AC frequency response analysis for RLC circuits
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-4 space-y-4">
            <CircuitInput
              netlist={netlist}
              onNetlistChange={handleNetlistChange}
              errors={parseErrors}
            />
            <AnalysisControls
              mode={analysisMode}
              onModeChange={setAnalysisMode}
              transientParams={transientParams}
              onTransientParamsChange={setTransientParams}
              acParams={acParams}
              onAcParamsChange={setAcParams}
              onRun={handleRun}
              isRunning={isRunning}
            />
          </div>

          {/* Right Column: Results & Charts */}
          <div className="lg:col-span-8 space-y-4">
            <ResultsPanel
              dcResult={dcResult}
              error={error}
              analysisMode={analysisMode}
            />
            <ChartPanel
              transientResult={transientResult}
              acResult={acResult}
              analysisMode={analysisMode}
            />

            {/* Show documentation when no results */}
            {!dcResult && !transientResult && !acResult && !error && (
              <DocumentationPanel />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="container max-w-7xl py-4">
          <p className="text-xs text-muted-foreground text-center">
            Advanced Circuit Analyzer Tool — Educational RLC circuit analysis using Modified Nodal Analysis.
            Not a SPICE simulator. Results are for academic use.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
