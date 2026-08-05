export class NotFound extends Error {
  details: any = null;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'NotFound';
    this.details = details;
  }
}
