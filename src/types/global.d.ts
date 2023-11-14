declare global {
  interface Window {
    app: App;
  }
  interface Math {
    sum(args: number[]): number;
  }
}

export {};
