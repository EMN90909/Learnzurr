export type BoardPoint = { x: number; y: number; pressure?: number };
export type BoardStroke = { id: string; color: string; width: number; points: BoardPoint[] };
export function serializeStroke(stroke: BoardStroke) { return JSON.stringify(stroke); }
export function parseStroke(raw: string): BoardStroke { return JSON.parse(raw) as BoardStroke; }
