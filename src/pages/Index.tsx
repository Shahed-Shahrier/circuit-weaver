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
import { Activity, Signal, Timer, Zap } from "lucide-react";

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
    <div className="min-h-screen bg-circuit-gradient">
      <div className="circuit-orb circuit-orb-primary" aria-hidden="true" />
      <div className="circuit-orb circuit-orb-accent" aria-hidden="true" />
      {/* Header */}
      <header className="border-b border-white/70 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="container max-w-[88rem] py-3 sm:py-4">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">Advanced Circuit Analyzer Tool</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate sm:whitespace-normal">
                DC · Transient · AC frequency response analysis for RLC circuits
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-[88rem] py-5 sm:py-8 relative z-10">
        <section className="mb-6 sm:mb-8 circuit-panel animate-fade-in">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-primary/80 font-semibold">Simulation Workspace</p>
              <h2 className="text-xl sm:text-3xl font-semibold tracking-tight mt-1 leading-tight">Model, run, and inspect circuits in one flow</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
                Write a netlist, choose a solver mode, and view validated numerical output with interactive charts.
              </p>
            </div>
            <div className="grid grid-cols-1 min-[460px]:grid-cols-3 gap-2 w-full md:w-auto md:min-w-[24rem]">
              <div className="metric-chip">
                <Activity className="w-4 h-4 text-primary" />
                <span>DC</span>
              </div>
              <div className="metric-chip">
                <Timer className="w-4 h-4 text-accent" />
                <span>Transient</span>
              </div>
              <div className="metric-chip">
                <Signal className="w-4 h-4 text-chart-magnitude" />
                <span>AC Sweep</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-4 space-y-4 animate-fade-in">
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
          <div className="lg:col-span-8 space-y-4 animate-fade-in">
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
      <footer className="border-t border-white/70 bg-white/70 backdrop-blur-md mt-8">
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
