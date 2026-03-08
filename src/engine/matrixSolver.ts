/**
 * Gaussian elimination solver for real-valued linear systems Ax = b.
 * Also includes a complex system solver for AC analysis.
 */

import type { Complex } from "./complex";
import { div as cdiv, sub as csub, mul as cmul, complex } from "./complex";

/**
 * Solve a real linear system Ax = b using Gaussian elimination with partial pivoting.
 * Returns the solution vector x, or throws on singular matrix.
 */
export function solveReal(A: number[][], b: number[]): number[] {
  const n = A.length;
  // Build augmented matrix
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-15) {
      throw new Error(`Singular matrix: pivot too small at column ${col}. The circuit may be ill-defined or disconnected.`);
    }
    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }
    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * x[j];
    }
    x[i] = sum / aug[i][i];
  }
  return x;
}

/**
 * Solve a complex linear system Ax = b using Gaussian elimination with partial pivoting.
 */
export function solveComplex(A: Complex[][], b: Complex[]): Complex[] {
  const n = A.length;
  // Build augmented matrix
  const aug: Complex[][] = A.map((row, i) => [...row.map(c => ({ ...c })), { ...b[i] }]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting by magnitude
    let maxRow = col;
    let maxVal = Math.sqrt(aug[col][col].re ** 2 + aug[col][col].im ** 2);
    for (let row = col + 1; row < n; row++) {
      const val = Math.sqrt(aug[row][col].re ** 2 + aug[row][col].im ** 2);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }
    if (maxVal < 1e-15) {
      throw new Error(`Singular complex matrix at column ${col}.`);
    }
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }
    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = cdiv(aug[row][col], aug[col][col]);
      for (let j = col; j <= n; j++) {
        aug[row][j] = csub(aug[row][j], cmul(factor, aug[col][j]));
      }
    }
  }

  // Back substitution
  const x: Complex[] = new Array(n).fill(null).map(() => complex(0));
  for (let i = n - 1; i >= 0; i--) {
    let sum: Complex = { ...aug[i][n] };
    for (let j = i + 1; j < n; j++) {
      sum = csub(sum, cmul(aug[i][j], x[j]));
    }
    x[i] = cdiv(sum, aug[i][i]);
  }
  return x;
}
