import { Point } from './Point.ts';

export class Vertex {
  name: string;
  position: Point;

  constructor(name: string, position: Point) {
    this.name = name;
    this.position = position;
  }

  clone() {
    return new Vertex(this.name, this.position.clone());
  }
}

export class Edge {
  start: Vertex;
  end: Vertex;

  constructor(start: Vertex, end: Vertex) {
    this.start = start;
    this.end = end;
  }
}

export class Graph {
  vertices: Vertex[];
  edges: Edge[];

  constructor(vertices: Vertex[], edgeIndices: number[][]) {
    this.vertices = vertices;
    this.edges = edgeIndices.map(([start, end]) => new Edge(vertices[start], vertices[end]));
  }

  clone() {
    return new Graph(
      this.vertices.map(vertex => vertex.clone()),
      this.edges.map(edge => [this.vertices.indexOf(edge.start), this.vertices.indexOf(edge.end)])
    );
  }
}
