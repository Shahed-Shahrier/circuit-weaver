/**
 * Sample circuit netlists for demonstration and testing.
 */

export interface SampleCircuit {
  name: string;
  description: string;
  netlist: string;
  recommendedAnalysis: "dc" | "transient" | "ac";
  category: string;
}

export const sampleCircuits: SampleCircuit[] = [
  {
    name: "Resistor Voltage Divider",
    description: "Two resistors in series with a voltage source. Output at node 2.",
    netlist: `# Voltage Divider: V1 → R1 → node2 → R2 → GND
V1 1 0 10
R1 1 2 1000
R2 2 0 1000`,
    recommendedAnalysis: "dc",
    category: "DC",
  },
  {
    name: "Resistive Network with Current Source",
    description: "A current source driving two parallel resistors.",
    netlist: `# Current source with parallel resistors
I1 0 1 0.01
R1 1 0 1000
R2 1 2 500
R3 2 0 2000`,
    recommendedAnalysis: "dc",
    category: "DC",
  },
  {
    name: "RC Charging Circuit",
    description: "Step response of an RC circuit. Capacitor charges through resistor.",
    netlist: `# RC Charging: V1 → R1 → C1 → GND
V1 1 0 5
R1 1 2 1000
C1 2 0 0.000001`,
    recommendedAnalysis: "transient",
    category: "Transient",
  },
  {
    name: "RL Step Response",
    description: "Step response of an RL circuit. Current builds through inductor.",
    netlist: `# RL Step Response: V1 → R1 → L1 → GND
V1 1 0 10
R1 1 2 100
L1 2 0 0.1`,
    recommendedAnalysis: "transient",
    category: "Transient",
  },
  {
    name: "RC Low-Pass Filter",
    description: "First-order RC low-pass filter. Cutoff ≈ 1.6 kHz.",
    netlist: `# RC Low-Pass: I source → R → C → GND, output at node 1
I1 0 1 1
R1 1 2 100
C1 2 0 0.000001`,
    recommendedAnalysis: "ac",
    category: "AC",
  },
  {
    name: "RC High-Pass Filter",
    description: "First-order RC high-pass filter. Cutoff ≈ 1.6 kHz.",
    netlist: `# RC High-Pass: I source → C → R → GND, output at node 2
I1 0 1 1
C1 1 2 0.000001
R1 2 0 100`,
    recommendedAnalysis: "ac",
    category: "AC",
  },
  {
    name: "Series RLC Resonant Circuit",
    description: "Series RLC with resonance at ≈ 7.1 kHz. Shows resonant peak in AC analysis.",
    netlist: `# Series RLC: V source → R → L → C → GND
V1 1 0 1
R1 1 2 10
L1 2 3 0.005
C1 3 0 0.0000001`,
    recommendedAnalysis: "ac",
    category: "AC",
  },
  {
    name: "RLC Transient (Underdamped)",
    description: "Underdamped RLC step response showing oscillatory behavior.",
    netlist: `# Underdamped RLC
V1 1 0 5
R1 1 2 10
L1 2 3 0.01
C1 3 0 0.00001`,
    recommendedAnalysis: "transient",
    category: "Transient",
  },
];
