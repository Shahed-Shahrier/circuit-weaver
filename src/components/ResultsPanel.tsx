import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DcResult } from "@/engine/dcAnalysis";

interface ResultsPanelProps {
  dcResult: DcResult | null;
  error: string | null;
  analysisMode: string;
}

export function ResultsPanel({ dcResult, error, analysisMode }: ResultsPanelProps) {
  if (error) {
    return (
      <Card className="smooth-card border-destructive/50 bg-white/85 backdrop-blur-sm animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-destructive">Analysis Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-mono text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!dcResult && analysisMode === "dc") {
    return null;
  }

  if (dcResult && analysisMode === "dc") {
    return (
      <Card className="smooth-card border-white/60 bg-white/85 backdrop-blur-sm animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">DC Analysis Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Node Voltages</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Node</TableHead>
                  <TableHead className="text-right">Voltage (V)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dcResult.nodeVoltages.map((nv) => (
                  <TableRow key={nv.node}>
                    <TableCell className="font-mono">Node {nv.node}{nv.node === 0 ? " (GND)" : ""}</TableCell>
                    <TableCell className="text-right font-mono">{nv.voltage.toFixed(6)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {dcResult.branchCurrents.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Branch Currents</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Current (A)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dcResult.branchCurrents.map((bc) => (
                    <TableRow key={bc.name}>
                      <TableCell className="font-mono">{bc.name}</TableCell>
                      <TableCell className="text-right font-mono">{bc.current.toFixed(6)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Matrix size: {dcResult.matrixSize}×{dcResult.matrixSize} (MNA)
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
