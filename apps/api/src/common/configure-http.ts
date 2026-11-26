import { BadRequestException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { parse } from 'node:querystring';

const nonemptyJsonRequests = new WeakSet<IncomingMessage>();

export function hasJsonBody(request: IncomingMessage): boolean {
  return nonemptyJsonRequests.has(request);
}

export function configureHttp(app: NestExpressApplication) {
  app.set('query parser', (query: string) => {
    try {
      decodeURIComponent(query);
    } catch {
      throw new BadRequestException();
    }
    // Preserve repeated keys so validation can reject arrays for scalar fields.
    return parse(query, '&', '=', { maxKeys: 0 });
  });
  app.useBodyParser('json', {
    limit: '100kb',
    verify: (
      request: IncomingMessage,
      _response: ServerResponse,
      body: Buffer,
    ) => {
      if (body.length > 0) nonemptyJsonRequests.add(request);
    },
  });
}
