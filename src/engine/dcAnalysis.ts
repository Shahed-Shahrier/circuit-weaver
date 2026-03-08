/**
 * DC Analysis using Modified Nodal Analysis (MNA).
 * 
 * In DC steady state:
 *   - Resistor: normal conductance G = 1/R
 *   - Capacitor: open circuit (ignored)
 *   - Inductor: short circuit (modeled as zero-resistance wire via MNA extra row)
 *   - Current source: contributes to RHS vector
 *   - Voltage source: extra MNA row/column
 */

import type { CircuitComponent } from "./parser";
import { buildNodeMap, getNodeCount } from "./parser";
import { solveReal } from "./matrixSolver";

export interface DcResult {
  nodeVoltages: { node: number; voltage: number }[];
  branchCurrents: { name: string; current: number }[];
  matrixSize: number;
}

export function runDcAnalysis(
  components: CircuitComponent[],
  nodes: number[]
): DcResult {
  const nodeMap = buildNodeMap(nodes);
  const numNodes = getNodeCount(nodes);

  // Count extra MNA variables: voltage sources and inductors (short circuit = 0V source)
  const extraComponents: CircuitComponent[] = [];
  for (const c of components) {
    if (c.type === "V" || c.type === "L") {
      extraComponents.push(c);
    }
  }
  const numExtra = extraComponents.length;
  const size = numNodes + numExtra;

  const A: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const b: number[] = new Array(size).fill(0);

  // Stamp components
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
      case "C":
        // Open circuit in DC — no stamp
        break;
      case "L": {
        // Short circuit in DC — model as 0V voltage source
        const extraIdx = numNodes + extraComponents.indexOf(c);
        // V(node1) - V(node2) = 0
        if (i >= 0) A[extraIdx][i] = 1;
        if (j >= 0) A[extraIdx][j] = -1;
        if (i >= 0) A[i][extraIdx] = 1;
        if (j >= 0) A[j][extraIdx] = -1;
        b[extraIdx] = 0;
        break;
      }
      case "I": {
        // Current source: current flows from node1 to node2, convention: I enters node2
        if (i >= 0) b[i] -= c.value;
        if (j >= 0) b[j] += c.value;
        break;
      }
      case "V": {
        const extraIdx = numNodes + extraComponents.indexOf(c);
        // V(node1) - V(node2) = value
        if (i >= 0) A[extraIdx][i] = 1;
        if (j >= 0) A[extraIdx][j] = -1;
        if (i >= 0) A[i][extraIdx] = 1;
        if (j >= 0) A[j][extraIdx] = -1;
        b[extraIdx] = c.value;
        break;
      }
    }
  }

  const x = solveReal(A, b);

  const nodeVoltages: DcResult["nodeVoltages"] = [{ node: 0, voltage: 0 }];
  for (const [node, idx] of nodeMap.entries()) {
    nodeVoltages.push({ node, voltage: x[idx] });
  }
  nodeVoltages.sort((a, b) => a.node - b.node);

  const branchCurrents: DcResult["branchCurrents"] = [];
  for (let k = 0; k < numExtra; k++) {
    branchCurrents.push({
      name: extraComponents[k].name,
      current: x[numNodes + k],
    });
  }

  // Also compute resistor branch currents
  for (const c of components) {
    if (c.type === "R") {
      const v1 = c.node1 === 0 ? 0 : x[nodeMap.get(c.node1)!];
      const v2 = c.node2 === 0 ? 0 : x[nodeMap.get(c.node2)!];
      branchCurrents.push({ name: c.name, current: (v1 - v2) / c.value });
    }
  }

  return { nodeVoltages, branchCurrents, matrixSize: size };
}
