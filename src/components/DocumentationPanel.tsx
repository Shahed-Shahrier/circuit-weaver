import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function DocumentationPanel() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Documentation & Reference</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="components">
            <AccordionTrigger>Supported Components</AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <p><strong>R</strong> — Resistor (Ohms). <code className="font-mono bg-muted px-1 rounded">R1 1 2 1000</code></p>
              <p><strong>L</strong> — Inductor (Henries). <code className="font-mono bg-muted px-1 rounded">L1 2 0 0.005</code></p>
              <p><strong>C</strong> — Capacitor (Farads). <code className="font-mono bg-muted px-1 rounded">C1 1 0 1e-6</code></p>
              <p><strong>I</strong> — Current Source (Amperes). <code className="font-mono bg-muted px-1 rounded">I1 0 1 0.01</code></p>
              <p><strong>V</strong> — Voltage Source (Volts). <code className="font-mono bg-muted px-1 rounded">V1 1 0 10</code></p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="analyses">
            <AccordionTrigger>Supported Analyses</AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <p><strong>DC Analysis</strong> — Computes steady-state node voltages and branch currents. Capacitors are open circuits; inductors are short circuits.</p>
              <p><strong>Transient Analysis</strong> — Time-domain response using backward Euler integration. Supports RC, RL, and RLC step responses.</p>
              <p><strong>AC / Frequency Response</strong> — Frequency sweep using complex impedances. Generates Bode magnitude and phase plots.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="method">
            <AccordionTrigger>Mathematical Method</AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <p>The solver uses <strong>Modified Nodal Analysis (MNA)</strong> to construct the system <code className="font-mono bg-muted px-1 rounded">Ax = b</code>.</p>
              <p>Each component "stamps" its contribution into the conductance matrix A and source vector b. Voltage sources and inductors (in DC) add extra variables for branch currents.</p>
              <p>The system is solved via Gaussian elimination with partial pivoting, implemented entirely in TypeScript.</p>
              <p>For AC analysis, the same MNA framework uses complex arithmetic with frequency-dependent impedances.</p>
              <p>Transient analysis uses backward Euler time-stepping with companion models for capacitors (G=C/dt) and inductors.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="input">
            <AccordionTrigger>Input Format</AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <p>Each line: <code className="font-mono bg-muted px-1 rounded">ComponentName Node1 Node2 Value</code></p>
              <p>Node 0 is always ground. Nodes must be non-negative integers.</p>
              <p>Lines starting with <code className="font-mono bg-muted px-1 rounded">#</code> or <code className="font-mono bg-muted px-1 rounded">//</code> are comments.</p>
              <p>Blank lines are ignored.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="limitations">
            <AccordionTrigger>Limitations</AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              <p>• This is <strong>not</strong> a SPICE simulator. It is an educational circuit analyzer.</p>
              <p>• Nonlinear devices (diodes, transistors) are not supported.</p>
              <p>• Transient analysis uses simplified time-stepping suitable for standard RC, RL, and RLC circuits.</p>
              <p>• No symbolic solving — all analysis is numerical.</p>
              <p>• Large or complex networks may produce ill-conditioned matrices.</p>
              <p>• Results are intended for academic / educational use.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
