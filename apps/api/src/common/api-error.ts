import { HttpException } from '@nestjs/common';

/** An application error whose message is safe to send to the caller. */
export class ApiError extends HttpException {
  constructor(
    status: number,
    readonly code: string,
    readonly publicMessage: string,
  ) {
    super(publicMessage, status);
  }
}
