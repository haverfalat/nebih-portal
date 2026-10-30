export class NebihError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class HttpError extends NebihError {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`HTTP ${status} while requesting ${url}`);
  }
}

export class ParseError extends NebihError {}
export class ValidationError extends NebihError {}
export class CaptchaRequiredError extends NebihError {}
export class ResponseTooLargeError extends NebihError {}
