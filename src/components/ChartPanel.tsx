import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { TransientResult } from "@/engine/transientAnalysis";
import type { AcResult } from "@/engine/acAnalysis";

interface ChartPanelProps {
  transientResult: TransientResult | null;
  acResult: AcResult | null;
  analysisMode: string;
}

export function ChartPanel({ transientResult, acResult, analysisMode }: ChartPanelProps) {
  if (analysisMode === "transient" && transientResult) {
    // Get unique nodes (excluding 0)
    const samplePoint = transientResult.points[0];
    if (!samplePoint) return null;
    const nonGroundNodes = samplePoint.nodeVoltages.filter(nv => nv.node !== 0);
    const branchNames = samplePoint.branchCurrents.map(bc => bc.name);

    const voltageData = transientResult.points.map(p => {
      const entry: Record<string, number> = { time: p.time * 1000 }; // ms
      for (const nv of p.nodeVoltages) {
        if (nv.node !== 0) entry[`V(${nv.node})`] = nv.voltage;
      }
      return entry;
    });

    const currentData = transientResult.points.map(p => {
      const entry: Record<string, number> = { time: p.time * 1000 };
      for (const bc of p.branchCurrents) {
        entry[bc.name] = bc.current * 1000; // mA
      }
      return entry;
    });

    const colors = ["hsl(215, 80%, 48%)", "hsl(160, 60%, 42%)", "hsl(262, 60%, 55%)", "hsl(25, 90%, 55%)", "hsl(340, 70%, 50%)"];

    return (
      <div className="space-y-4 animate-fade-in">
        <Card className="smooth-card border-white/60 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Voltage vs Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={voltageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                  <XAxis dataKey="time" label={{ value: "Time (ms)", position: "insideBottom", offset: -5 }} tick={{ fontSize: 11 }} />
                  <YAxis label={{ value: "Voltage (V)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, fontFamily: "'JetBrains Mono'" }} />
                  <Legend />
                  {nonGroundNodes.map((nv, i) => (
                    <Line key={nv.node} type="monotone" dataKey={`V(${nv.node})`} stroke={colors[i % colors.length]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {branchNames.length > 0 && (
          <Card className="smooth-card border-white/60 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current vs Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chart-shell">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="time" label={{ value: "Time (ms)", position: "insideBottom", offset: -5 }} tick={{ fontSize: 11 }} />
                    <YAxis label={{ value: "Current (mA)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, fontFamily: "'JetBrains Mono'" }} />
                    <Legend />
                    {branchNames.map((name, i) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={colors[(i + 1) % colors.length]} dot={false} strokeWidth={2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (analysisMode === "ac" && acResult) {
    const outNodeIdx = acResult.points[0]?.nodeVoltages.findIndex(nv => nv.node === acResult.outputNode);
    if (outNodeIdx === undefined || outNodeIdx < 0) return null;

    const magData = acResult.points.map(p => ({
      freq: p.frequency,
      magnitude: p.nodeVoltages[outNodeIdx].magnitudeDb,
    }));

    const phaseData = acResult.points.map(p => ({
      freq: p.frequency,
      phase: p.nodeVoltages[outNodeIdx].phaseDeg,
    }));

    return (
      <div className="space-y-4 animate-fade-in">
        <Card className="smooth-card border-white/60 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bode Plot — Magnitude (Node {acResult.outputNode})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={magData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                  <XAxis
                    dataKey="freq"
                    scale="log"
                    domain={["dataMin", "dataMax"]}
                    type="number"
                    label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -5 }}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}
                  />
                  <YAxis label={{ value: "Magnitude (dB)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, fontFamily: "'JetBrains Mono'" }}
                    formatter={(v: number) => `${v.toFixed(2)} dB`}
                    labelFormatter={(v: number) => `${v.toFixed(1)} Hz`} />
                  <Line type="monotone" dataKey="magnitude" stroke="hsl(262, 60%, 55%)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="smooth-card border-white/60 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bode Plot — Phase (Node {acResult.outputNode})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={phaseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                  <XAxis
                    dataKey="freq"
                    scale="log"
                    domain={["dataMin", "dataMax"]}
                    type="number"
                    label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -5 }}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}
                  />
                  <YAxis label={{ value: "Phase (°)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, fontFamily: "'JetBrains Mono'" }}
                    formatter={(v: number) => `${v.toFixed(2)}°`}
                    labelFormatter={(v: number) => `${v.toFixed(1)} Hz`} />
                  <Line type="monotone" dataKey="phase" stroke="hsl(25, 90%, 55%)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
