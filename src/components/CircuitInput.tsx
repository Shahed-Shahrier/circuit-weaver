import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { sampleCircuits } from "@/engine/samples";
import { Badge } from "@/components/ui/badge";

interface CircuitInputProps {
  netlist: string;
  onNetlistChange: (netlist: string) => void;
  errors: string[];
}

export function CircuitInput({ netlist, onNetlistChange, errors }: CircuitInputProps) {
  return (
    <div className="space-y-4">
      <Card className="smooth-card border-white/60 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Circuit Netlist</CardTitle>
          <CardDescription>
            Enter components: <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Name Node1 Node2 Value</code>
            &nbsp;— Supported: R, L, C, I, V. Ground = node 0.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[220px] sm:min-h-[250px] font-mono text-sm bg-muted/55 border border-input rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ring transition-shadow duration-200"
            value={netlist}
            onChange={(e) => onNetlistChange(e.target.value)}
            placeholder={`# Example:\nR1 1 2 100\nL1 2 0 0.005\nC1 1 0 0.00001\nI1 0 1 1`}
            spellCheck={false}
          />
          {errors.length > 0 && (
            <div className="mt-3 space-y-1">
              {errors.map((err, i) => (
                <p key={i} className="text-sm text-destructive font-mono">⚠ {err}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="smooth-card border-white/60 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sample Circuits</CardTitle>
          <CardDescription>Click to load a pre-built circuit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {sampleCircuits.map((s) => (
              <button
                key={s.name}
                className="flex items-center gap-3 text-left p-3 rounded-lg border border-input hover:bg-muted/60 transition-all duration-200 hover:translate-x-0.5"
                onClick={() => onNetlistChange(s.netlist)}
              >
                <Badge
                  variant={s.category === "DC" ? "default" : s.category === "Transient" ? "secondary" : "outline"}
                  className="shrink-0 w-20 justify-center"
                >
                  {s.category}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
