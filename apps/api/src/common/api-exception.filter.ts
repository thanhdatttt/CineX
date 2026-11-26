import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ApiError } from './api-error';

const errors: Partial<Record<number, [code: string, message: string]>> = {
  400: ['VALIDATION_ERROR', 'Request data is invalid.'],
  401: ['UNAUTHENTICATED', 'Authentication required or credentials invalid.'],
  403: ['FORBIDDEN', 'Permission denied.'],
  404: ['RESOURCE_NOT_FOUND', 'Resource not found.'],
  409: ['CONFLICT', 'The request conflicts with the current resource state.'],
  413: ['PAYLOAD_TOO_LARGE', 'Request body exceeds the size limit.'],
  415: ['UNSUPPORTED_MEDIA_TYPE', 'Send the request body as application/json.'],
  429: ['RATE_LIMITED', 'Too many requests.'],
  503: ['SERVICE_UNAVAILABLE', 'Service unavailable. Try again later.'],
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) {
      response.end();
      return;
    }

    const status = getStatus(exception);
    const [code, message] =
      exception instanceof ApiError
        ? [exception.code, exception.publicMessage]
        : (errors[status] ??
          (status < 500
            ? ['REQUEST_ERROR', 'The request could not be processed.']
            : ['INTERNAL_ERROR', 'An unexpected error occurred.']));
    const requestId = randomUUID();
    if (status === 500) {
      this.logger.error(`Request ${requestId} failed with status ${status}.`);
    }
    response.setHeader('X-Request-Id', requestId);
    response.status(status).json({ error: { code, message, requestId } });
  }
}

function getStatus(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();

  // Express parser errors other than malformed JSON can arrive as HTTP errors.
  if (exception instanceof Error && 'statusCode' in exception) {
    const status = exception.statusCode;
    if (status === 400 || status === 413 || status === 415) return status;
  }

  return HttpStatus.INTERNAL_SERVER_ERROR;
}
