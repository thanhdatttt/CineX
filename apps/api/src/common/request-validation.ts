import {
  applyDecorators,
  ArgumentMetadata,
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnsupportedMediaTypeException,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsUUID,
  Max,
  Min,
  NotContains,
  ValidateIf,
} from 'class-validator';
import type { ValidationOptions } from 'class-validator';
import type { Request } from 'express';
import { hasJsonBody } from './configure-http';

type RequestInput = 'body' | 'query';

// Routes opt in to the parts of the request for which they have DTOs.
const acceptedInput = Reflector.createDecorator<RequestInput[]>();
export const AcceptRequestInput = (...sources: RequestInput[]) =>
  acceptedInput(sources);

@Injectable()
export class RequestInputInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const input = this.reflector.get(acceptedInput, context.getHandler()) ?? [];
    const body: unknown = request.body;
    const hasBody =
      request.headers['transfer-encoding'] !== undefined ||
      Number(request.headers['content-length'] ?? 0) > 0;

    if (!input.includes('query') && Object.keys(request.query).length > 0) {
      throw new BadRequestException();
    }
    if (!input.includes('body')) {
      if (body !== undefined && !isEmptyObject(body)) {
        throw new BadRequestException();
      }
      if (body === undefined && hasBody) {
        throw new BadRequestException();
      }
    } else {
      if (!hasBody) throw new BadRequestException();
      if (!request.is('application/json')) {
        throw new UnsupportedMediaTypeException();
      }
      if (!hasJsonBody(request)) throw new BadRequestException();
    }

    return next.handle();
  }
}

@Injectable()
export class RequestValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: true,
    });
  }

  override transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'custom' && metadata.data === undefined) {
      if (!isObject(value)) throw new BadRequestException();

      // Nest and class-transformer discard some keys before whitelisting.
      if (
        Object.keys(value).some((key) => Object.hasOwn(Object.prototype, key))
      ) {
        throw new BadRequestException();
      }
    }
    return super.transform(value, metadata);
  }
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyObject(value: unknown): boolean {
  return isObject(value) && Object.keys(value).length === 0;
}

export function Trim() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as unknown),
  );
}

export function IsText(options?: ValidationOptions) {
  return applyDecorators(IsString(options), NotContains('\0', options));
}

export function OptionalField() {
  return ValidateIf((_, value: unknown) => value !== undefined);
}

export function DecimalInteger() {
  return Transform(({ value }) =>
    typeof value === 'string' && /^\d+$/.test(value)
      ? Number(value)
      : (value as unknown),
  );
}

export function Uuid() {
  return applyDecorators(
    Transform(({ value }) =>
      typeof value === 'string' ? value.toLowerCase() : (value as unknown),
    ),
    IsUUID(),
  );
}

export class IdParamsDto {
  @Uuid()
  id!: string;
}

export class PaginationQueryDto {
  @DecimalInteger()
  @IsInt()
  @Min(1)
  @Max(21_474_837) // Keep (page - 1) * limit within a signed 32-bit offset.
  page = 1;

  @DecimalInteger()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
