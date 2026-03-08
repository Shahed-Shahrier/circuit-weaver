/**
 * Transient Analysis for simple RLC circuits.
 * 
 * Uses backward Euler time-stepping with MNA formulation.
 * At each time step, capacitors and inductors are replaced by companion models:
 *   - Capacitor: G_eq = C/dt, I_eq = C/dt * v_prev
 *   - Inductor: G_eq = dt/L, I_eq = i_prev (modeled via extra MNA variable)
 * 
 * This is a simplified but correct approach for the supported circuit classes.
 */

import type { CircuitComponent } from "./parser";
import { buildNodeMap, getNodeCount } from "./parser";
import { solveReal } from "./matrixSolver";

export interface TransientParams {
  tStart: number;
  tEnd: number;
  dt: number;
}

export interface TransientPoint {
  time: number;
  nodeVoltages: { node: number; voltage: number }[];
  branchCurrents: { name: string; current: number }[];
}

export interface TransientResult {
  points: TransientPoint[];
  dt: number;
}

export function runTransientAnalysis(
  components: CircuitComponent[],
  nodes: number[],
  params: TransientParams
): TransientResult {
  const nodeMap = buildNodeMap(nodes);
  const numNodes = getNodeCount(nodes);

  // Extra MNA variables: voltage sources + inductors
  const extraComponents: CircuitComponent[] = components.filter(
    (c) => c.type === "V" || c.type === "L"
  );
  const numExtra = extraComponents.length;
  const size = numNodes + numExtra;

  const dt = params.dt;
  const numSteps = Math.ceil((params.tEnd - params.tStart) / dt);

  // State: previous node voltages and inductor currents
  let prevVoltages = new Array(numNodes).fill(0);
  let prevInductorCurrents = new Map<string, number>();
  for (const c of components) {
    if (c.type === "L") prevInductorCurrents.set(c.name, 0);
  }
  let prevCapVoltages = new Map<string, number>();
  for (const c of components) {
    if (c.type === "C") {
      prevCapVoltages.set(c.name, 0);
    }
  }

  const points: TransientPoint[] = [];

  for (let step = 0; step <= numSteps; step++) {
    const t = params.tStart + step * dt;

    const A: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
    const b: number[] = new Array(size).fill(0);

    for (const c of components) {
      const i = c.node1 !== 0 ? nodeMap.get(c.node1)! : -1;
      const j = c.node2 !== 0 ? nodeMap.get(c.node2)! : -1;

      switch (c.type) {
        case "R": {
          const g = 1 / c.value;
          if (i >= 0) A[i][i] += g;
          if (j >= 0) A[j][j] += g;
          if (i >= 0 && j >= 0) {
            A[i][j] -= g;
            A[j][i] -= g;
          }
          break;
        }
        case "C": {
          // Backward Euler companion: G_eq = C/dt, I_eq = G_eq * v_prev
          const geq = c.value / dt;
          if (i >= 0) A[i][i] += geq;
          if (j >= 0) A[j][j] += geq;
          if (i >= 0 && j >= 0) {
            A[i][j] -= geq;
            A[j][i] -= geq;
          }
          // History current
          const v1prev = i >= 0 ? prevVoltages[i] : 0;
          const v2prev = j >= 0 ? prevVoltages[j] : 0;
          const ieq = geq * (v1prev - v2prev);
          if (i >= 0) b[i] += ieq;
          if (j >= 0) b[j] -= ieq;
          break;
        }
        case "L": {
          // Backward Euler: inductor as voltage source with V = L/dt * i_prev
          // Model via MNA: extra variable is inductor current
          const extraIdx = numNodes + extraComponents.indexOf(c);
          // KVL: V(node1) - V(node2) - L/dt * I_L = -L/dt * I_L_prev
          // Rearranged for MNA stamps:
          if (i >= 0) A[extraIdx][i] = 1;
          if (j >= 0) A[extraIdx][j] = -1;
          A[extraIdx][extraIdx] = -c.value / dt;
          
          if (i >= 0) A[i][extraIdx] = 1;
          if (j >= 0) A[j][extraIdx] = -1;

          const iPrev = prevInductorCurrents.get(c.name) || 0;
          b[extraIdx] = -(c.value / dt) * iPrev;
          break;
        }
        case "I": {
          // Step source: active for t >= 0
          if (t >= 0) {
            if (i >= 0) b[i] -= c.value;
            if (j >= 0) b[j] += c.value;
          }
          break;
        }
        case "V": {
          const extraIdx = numNodes + extraComponents.indexOf(c);
          // Step voltage source
          if (i >= 0) { A[extraIdx][i] = 1; A[i][extraIdx] = 1; }
          if (j >= 0) { A[extraIdx][j] = -1; A[j][extraIdx] = -1; }
          b[extraIdx] = t >= 0 ? c.value : 0;
          break;
        }
      }
    }

    const x = solveReal(A, b);

    // Save state
    for (let k = 0; k < numNodes; k++) {
      prevVoltages[k] = x[k];
    }
    for (let k = 0; k < numExtra; k++) {
      const comp = extraComponents[k];
      if (comp.type === "L") {
        prevInductorCurrents.set(comp.name, x[numNodes + k]);
      }
    }

    const nodeVoltages: TransientPoint["nodeVoltages"] = [{ node: 0, voltage: 0 }];
    for (const [node, idx] of nodeMap.entries()) {
      nodeVoltages.push({ node, voltage: x[idx] });
    }
    nodeVoltages.sort((a, b) => a.node - b.node);

    const branchCurrents: TransientPoint["branchCurrents"] = [];
    for (let k = 0; k < numExtra; k++) {
      branchCurrents.push({ name: extraComponents[k].name, current: x[numNodes + k] });
    }
    for (const c of components) {
      if (c.type === "R") {
        const v1 = c.node1 === 0 ? 0 : x[nodeMap.get(c.node1)!];
        const v2 = c.node2 === 0 ? 0 : x[nodeMap.get(c.node2)!];
        branchCurrents.push({ name: c.name, current: (v1 - v2) / c.value });
      }
    }

    points.push({ time: t, nodeVoltages, branchCurrents });
  }

  return { points, dt };
}
