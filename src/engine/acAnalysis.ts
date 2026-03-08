/**
 * AC / Frequency Response Analysis.
 * 
 * Builds complex admittance matrix at each frequency point and solves.
 * Uses frequency-domain impedances:
 *   - R: Z = R
 *   - L: Z = jωL
 *   - C: Z = 1/(jωC)
 */

import type { CircuitComponent } from "./parser";
import { buildNodeMap, getNodeCount } from "./parser";
import { solveComplex } from "./matrixSolver";
import { complex, magnitude, phaseDeg, magnitudeDb, add, div as cdiv, type Complex } from "./complex";

export interface AcParams {
  startFreq: number;    // Hz
  endFreq: number;      // Hz
  numPoints: number;
  logScale: boolean;
}

export interface AcPoint {
  frequency: number;
  nodeVoltages: { node: number; magnitude: number; magnitudeDb: number; phaseDeg: number }[];
}

export interface AcResult {
  points: AcPoint[];
  outputNode: number;
}

export function runAcAnalysis(
  components: CircuitComponent[],
  nodes: number[],
  params: AcParams,
  outputNode?: number
): AcResult {
  const nodeMap = buildNodeMap(nodes);
  const numNodes = getNodeCount(nodes);
  const nonGroundNodes = nodes.filter(n => n !== 0);

  // Default output node: highest-numbered non-ground node
  const outNode = outputNode ?? (nonGroundNodes.length > 0 ? nonGroundNodes[nonGroundNodes.length - 1] : 1);

  // Generate frequency points
  const frequencies: number[] = [];
  if (params.logScale && params.startFreq > 0) {
    const logStart = Math.log10(params.startFreq);
    const logEnd = Math.log10(params.endFreq);
    for (let i = 0; i < params.numPoints; i++) {
      const logF = logStart + (logEnd - logStart) * (i / (params.numPoints - 1));
      frequencies.push(Math.pow(10, logF));
    }
  } else {
    for (let i = 0; i < params.numPoints; i++) {
      frequencies.push(params.startFreq + (params.endFreq - params.startFreq) * (i / (params.numPoints - 1)));
    }
  }

  // Count voltage sources for MNA
  const voltageSources = components.filter(c => c.type === "V");
  const numExtra = voltageSources.length;
  const size = numNodes + numExtra;

  const points: AcPoint[] = [];

  for (const freq of frequencies) {
    const omega = 2 * Math.PI * freq;

    const A: Complex[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => complex(0))
    );
    const b: Complex[] = Array.from({ length: size }, () => complex(0));

    for (const c of components) {
      const i = c.node1 !== 0 ? nodeMap.get(c.node1)! : -1;
      const j = c.node2 !== 0 ? nodeMap.get(c.node2)! : -1;

      switch (c.type) {
        case "R": {
          const g = complex(1 / c.value);
          if (i >= 0) A[i][i] = add(A[i][i], g);
          if (j >= 0) A[j][j] = add(A[j][j], g);
          if (i >= 0 && j >= 0) {
            A[i][j] = { re: A[i][j].re - g.re, im: A[i][j].im };
            A[j][i] = { re: A[j][i].re - g.re, im: A[j][i].im };
          }
          break;
        }
        case "L": {
          // Y = 1/(jωL) = -j/(ωL)
          const y = complex(0, -1 / (omega * c.value));
          if (i >= 0) A[i][i] = add(A[i][i], y);
          if (j >= 0) A[j][j] = add(A[j][j], y);
          if (i >= 0 && j >= 0) {
            A[i][j] = { re: A[i][j].re - y.re, im: A[i][j].im - y.im };
            A[j][i] = { re: A[j][i].re - y.re, im: A[j][i].im - y.im };
          }
          break;
        }
        case "C": {
          // Y = jωC
          const y = complex(0, omega * c.value);
          if (i >= 0) A[i][i] = add(A[i][i], y);
          if (j >= 0) A[j][j] = add(A[j][j], y);
          if (i >= 0 && j >= 0) {
            A[i][j] = { re: A[i][j].re - y.re, im: A[i][j].im - y.im };
            A[j][i] = { re: A[j][i].re - y.re, im: A[j][i].im - y.im };
          }
          break;
        }
        case "I": {
          // AC current source at this frequency
          if (i >= 0) b[i] = { re: b[i].re - c.value, im: b[i].im };
          if (j >= 0) b[j] = { re: b[j].re + c.value, im: b[j].im };
          break;
        }
        case "V": {
          const extraIdx = numNodes + voltageSources.indexOf(c);
          if (i >= 0) { A[extraIdx][i] = complex(1); A[i][extraIdx] = complex(1); }
          if (j >= 0) { A[extraIdx][j] = complex(-1); A[j][extraIdx] = complex(-1); }
          b[extraIdx] = complex(c.value);
          break;
        }
      }
    }

    const x = solveComplex(A, b);

    const nodeVoltages: AcPoint["nodeVoltages"] = [];
    for (const [node, idx] of nodeMap.entries()) {
      nodeVoltages.push({
        node,
        magnitude: magnitude(x[idx]),
        magnitudeDb: magnitudeDb(x[idx]),
        phaseDeg: phaseDeg(x[idx]),
      });
    }

    points.push({ frequency: freq, nodeVoltages });
  }

  return { points, outputNode: outNode };
}
