# ⚡ Circuit Weaver — Advanced Circuit Analyzer Tool

A browser-based educational RLC circuit analyzer that supports **DC**, **Transient (time-domain)**, and **AC (frequency-domain)** analysis. All computation runs entirely in the browser — no backend, no SPICE dependency — using a custom **Modified Nodal Analysis (MNA)** engine written in TypeScript.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Netlist Input Format](#netlist-input-format)
- [Analysis Modes](#analysis-modes)
  - [DC Analysis](#dc-analysis)
  - [Transient Analysis](#transient-analysis)
  - [AC / Frequency Response](#ac--frequency-response)
- [Sample Circuits](#sample-circuits)
- [Engine Architecture](#engine-architecture)
- [Limitations](#limitations)
- [Scripts Reference](#scripts-reference)
- [Contributing](#contributing)

---

## Features

- **Text-based netlist input** — describe circuits using a simple SPICE-like syntax
- **Three analysis modes** — DC steady-state, Transient step response, AC frequency sweep
- **Interactive charts** — Bode magnitude/phase plots for AC; voltage/current vs. time for Transient
- **Built-in sample circuits** — 8 pre-loaded circuits covering all analysis modes
- **Real-time error feedback** — parse errors are surfaced inline with line numbers
- **Zero backend** — the full MNA solver, Gaussian elimination, and complex arithmetic run in the browser
- **Dark/light theme** via `next-themes`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| UI components | [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| Routing | [React Router v6](https://reactrouter.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| State / data | [TanStack Query](https://tanstack.com/query) |
| Testing | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |
| Linting | [ESLint](https://eslint.org/) + `typescript-eslint` |
| Package manager | [Bun](https://bun.sh/) / npm |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18, **or** [Bun](https://bun.sh/) ≥ 1.0

### Install dependencies

```bash
# Using npm
npm install

# Using bun
bun install
```

### Run the development server

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

The output is placed in `dist/`.

### Preview the production build

```bash
npm run preview
```

---

## Project Structure

```
circuit-weaver/
├── public/                  # Static assets
├── src/
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Root component (routing + providers)
│   ├── pages/
│   │   ├── Index.tsx        # Main application page
│   │   └── NotFound.tsx     # 404 page
│   ├── components/
│   │   ├── CircuitInput.tsx      # Netlist textarea + sample loader
│   │   ├── AnalysisControls.tsx  # Mode selector + parameter inputs
│   │   ├── ResultsPanel.tsx      # DC node/branch result table
│   │   ├── ChartPanel.tsx        # Recharts-based Bode/transient plots
│   │   ├── DocumentationPanel.tsx # In-app reference accordion
│   │   ├── NavLink.tsx           # Navigation utility
│   │   └── ui/                   # shadcn/ui component library
│   ├── engine/
│   │   ├── parser.ts            # Netlist parser → CircuitComponent[]
│   │   ├── complex.ts           # Complex number arithmetic
│   │   ├── matrixSolver.ts      # Gaussian elimination (real + complex)
│   │   ├── dcAnalysis.ts        # DC MNA solver
│   │   ├── transientAnalysis.ts # Backward Euler transient solver
│   │   ├── acAnalysis.ts        # Frequency-domain AC solver
│   │   └── samples.ts           # Pre-built sample netlists
│   ├── hooks/                   # Custom React hooks
│   └── lib/                     # Utility helpers
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Netlist Input Format

Each non-blank, non-comment line defines one component:

```
ComponentName  Node1  Node2  Value
```

| Field | Description |
|---|---|
| `ComponentName` | Identifier starting with the component type letter (e.g. `R1`, `L2`, `C3`) |
| `Node1` / `Node2` | Non-negative integer node numbers. **Node 0 is always ground.** |
| `Value` | Component value in SI base units (Ω, H, F, A, V) |

**Supported component types:**

| Prefix | Type | Unit | Example |
|---|---|---|---|
| `R` | Resistor | Ohms (Ω) | `R1 1 2 1000` |
| `L` | Inductor | Henries (H) | `L1 2 0 0.005` |
| `C` | Capacitor | Farads (F) | `C1 1 0 1e-6` |
| `I` | Current Source | Amperes (A) | `I1 0 1 0.01` |
| `V` | Voltage Source | Volts (V) | `V1 1 0 10` |

**Comment syntax:**
- Lines starting with `#` or `//` are ignored
- Blank lines are ignored

**Example netlist — RC Charging Circuit:**
```
# RC Charging: V1 → R1 → C1 → GND
V1 1 0 5
R1 1 2 1000
C1 2 0 0.000001
```

---

## Analysis Modes

### DC Analysis

Computes steady-state node voltages and branch currents.

- **Capacitors** → treated as open circuits (no stamp in matrix)
- **Inductors** → treated as short circuits (modeled as 0 V voltage source via extra MNA variable)
- **Outputs:** node voltages (V), branch currents through voltage sources, inductors, and resistors (A)

### Transient Analysis

Simulates the time-domain step response from t = 0.

Uses **Backward Euler** time-stepping with companion models at each time step:
- **Capacitor:** equivalent conductance `G_eq = C/dt` + history current `I_eq = G_eq × v_prev`
- **Inductor:** extra MNA variable with KVL constraint `V = L/dt × (i_current − i_prev)`

**Configurable parameters:**

| Parameter | Default | Description |
|---|---|---|
| Start time (s) | `0` | Simulation start |
| End time (s) | `0.005` | Simulation end |
| Time step (s) | `0.000005` | Integration step size |

**Output:** interactive chart of node voltages vs. time

### AC / Frequency Response

Performs a frequency sweep using **complex-domain MNA** (frequency-dependent impedances):

- **R:** `Y = 1/R`
- **L:** `Y = 1/(jωL)`
- **C:** `Y = jωC`

**Configurable parameters:**

| Parameter | Default | Description |
|---|---|---|
| Start frequency (Hz) | `10` | Sweep start |
| End frequency (Hz) | `100,000` | Sweep end |
| Number of points | `200` | Frequency points |
| Scale | Log | Log or linear frequency axis |

**Output:** Bode plot showing magnitude (dB) and phase (degrees) vs. frequency for the highest-numbered non-ground node.

---

## Sample Circuits

Eight built-in circuits are available from the **Sample Circuits** panel:

| Name | Category | Description |
|---|---|---|
| Resistor Voltage Divider | DC | Two series resistors with a 10 V source |
| Resistive Network with Current Source | DC | Current source driving parallel resistors |
| RC Charging Circuit | Transient | Capacitor charges through resistor (τ = 1 ms) |
| RL Step Response | Transient | Current builds through inductor (τ = 1 ms) |
| RC Low-Pass Filter | AC | First-order LPF, cutoff ≈ 1.6 kHz |
| RC High-Pass Filter | AC | First-order HPF, cutoff ≈ 1.6 kHz |
| Series RLC Resonant Circuit | AC | Resonant peak at ≈ 7.1 kHz |
| RLC Transient (Underdamped) | Transient | Oscillatory step response |

---

## Engine Architecture

All circuit mathematics lives in `src/engine/` and has **no external solver dependencies**.

```
parseNetlist()          →  CircuitComponent[]  (parser.ts)
        ↓
buildNodeMap()          →  node → matrix index mapping
        ↓
runDcAnalysis()         →  stamp MNA matrix (real)    →  solveReal()
runTransientAnalysis()  →  stamp per time step (real)  →  solveReal()
runAcAnalysis()         →  stamp per frequency (complex) →  solveComplex()
```

**`matrixSolver.ts`** — Gaussian elimination with partial pivoting for both real (`solveReal`) and complex (`solveComplex`) systems `Ax = b`. Throws a descriptive error on singular matrices.

**`complex.ts`** — Complete complex arithmetic library: `add`, `sub`, `mul`, `div`, `magnitude`, `phase`, `phaseDeg`, `magnitudeDb`, `scale`, `conj`, `fromPolar`.

---

## Limitations

> This is an **educational tool**, not a full SPICE simulator.

- Nonlinear devices (diodes, transistors, MOSFETs) are **not supported**
- All sources are treated as **DC step sources** (no sinusoidal, PWM, or piecewise sources)
- Transient analysis uses simplified backward Euler — accurate for standard RC/RL/RLC but not guaranteed for stiff or highly complex networks
- No symbolic analysis — all results are numerical
- Large networks with many nodes may produce ill-conditioned matrices
- Results are intended for **academic / educational use only**

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Production build (TypeScript check + Vite bundle) |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |
| `npm run test` | Run Vitest test suite once |
| `npm run test:watch` | Run Vitest in watch mode |

---

## Contributing

1. Fork the repository and create your feature branch (`git checkout -b feature/my-feature`)
2. Make your changes and ensure lint/tests pass (`npm run lint && npm run test`)
3. Commit with a clear message and open a Pull Request

For bug reports or feature requests, please open an [Issue](../../issues).

---

*Advanced Circuit Analyzer Tool — Educational RLC circuit analysis using Modified Nodal Analysis. Not a SPICE simulator. Results are for academic use.*
