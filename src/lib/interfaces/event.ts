export interface IQueue<T extends string> {
  PROCESSOR: { NAME: string };
  JOBS: Record<T, string>;
}
