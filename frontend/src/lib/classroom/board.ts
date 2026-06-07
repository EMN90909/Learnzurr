export type BoardStroke = { x: number; y: number; color: string; width: number; at: number };
export class BoardState {
  strokes: BoardStroke[] = [];
  add(stroke: BoardStroke) { this.strokes = [...this.strokes, stroke]; }
  clear() { this.strokes = []; }
  serialize() { return JSON.stringify(this.strokes); }
}
