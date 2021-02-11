export class DumpNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DumpNotFoundError.prototype);
  }
}
