/**
 * Netlist parser for text-based circuit input.
 * Parses R, L, C, I, V components with validation.
 */

export type ComponentType = "R" | "L" | "C" | "I" | "V";

export interface CircuitComponent {
  type: ComponentType;
  name: string;
  node1: number;
  node2: number;
  value: number;
}

export interface ParseResult {
  components: CircuitComponent[];
  errors: string[];
  nodes: number[];
}

const VALID_TYPES: Record<string, ComponentType> = {
  R: "R",
  L: "L",
  C: "C",
  I: "I",
  V: "V",
};

/**
 * Parse a netlist string into circuit components.
 * Lines starting with '#' or '//' are comments. Blank lines are ignored.
 */
export function parseNetlist(input: string): ParseResult {
  const lines = input.split("\n");
  const components: CircuitComponent[] = [];
  const errors: string[] = [];
  const nodeSet = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Skip blank lines and comments
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;

    const tokens = line.split(/\s+/);

    if (tokens.length < 4) {
      errors.push(`Line ${lineNum}: Expected 4 fields (Name Node1 Node2 Value), got ${tokens.length}`);
      continue;
    }

    const name = tokens[0];
    const typeChar = name[0].toUpperCase();

    if (!VALID_TYPES[typeChar]) {
      errors.push(`Line ${lineNum}: Unknown component type '${typeChar}' in '${name}'. Supported: R, L, C, I, V`);
      continue;
    }

    const node1 = parseInt(tokens[1], 10);
    const node2 = parseInt(tokens[2], 10);

    if (isNaN(node1) || isNaN(node2) || node1 < 0 || node2 < 0) {
      errors.push(`Line ${lineNum}: Invalid node numbers. Nodes must be non-negative integers.`);
      continue;
    }

    if (node1 === node2) {
      errors.push(`Line ${lineNum}: Component '${name}' has both terminals on the same node (${node1}).`);
      continue;
    }

    const value = parseFloat(tokens[3]);
    if (isNaN(value)) {
      errors.push(`Line ${lineNum}: Invalid value '${tokens[3]}' for component '${name}'.`);
      continue;
    }

    if ((typeChar === "R" || typeChar === "L" || typeChar === "C") && value <= 0) {
      errors.push(`Line ${lineNum}: Component '${name}' value must be positive, got ${value}.`);
      continue;
    }

    const type = VALID_TYPES[typeChar];
    components.push({ type, name, node1, node2, value });
    nodeSet.add(node1);
    nodeSet.add(node2);
  }

  const nodes = Array.from(nodeSet).sort((a, b) => a - b);

  // Validate ground node
  if (components.length > 0 && !nodeSet.has(0)) {
    errors.push("Circuit must include ground node (0). No component is connected to node 0.");
  }

  return { components, errors, nodes };
}

/**
 * Build a mapping from node numbers to matrix indices (excluding ground node 0).
 */
export function buildNodeMap(nodes: number[]): Map<number, number> {
  const map = new Map<number, number>();
  let idx = 0;
  for (const n of nodes) {
    if (n !== 0) {
      map.set(n, idx);
      idx++;
    }
  }
  return map;
}

/**
 * Get the number of non-ground nodes.
 */
export function getNodeCount(nodes: number[]): number {
  return nodes.filter((n) => n !== 0).length;
}
