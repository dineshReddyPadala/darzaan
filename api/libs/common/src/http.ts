import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ApiErrorBody {
  error: { code: string; message: string; details: unknown; requestId: string };
}

export function errorBody(code: string, message: string, details: unknown, requestId: string): ApiErrorBody {
  return { error: { code, message, details: details ?? null, requestId } };
}

export function codeForStatus(status: number): string {
  if (status === 400) return 'VALIDATION_ERROR';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'IDEMPOTENCY_MISMATCH';
  return 'INTERNAL';
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<{ status: (code: number) => { send: (body: unknown) => void }; header?: (k: string, v: string) => void }>();
    const request = host.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const requestId = request.headers['x-request-id'] || randomUUID();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';
    let details: unknown = null;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') message = response;
      else if (typeof response === 'object' && response) {
        const body = response as { message?: unknown; error?: unknown };
        if (Array.isArray(body.message)) {
          message = 'Check the highlighted fields';
          details = body.message;
        } else if (typeof body.message === 'string') message = body.message;
        else message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }
    reply.status(status).send(errorBody(codeForStatus(status), message, details, requestId));
  }
}

export class AppError extends HttpException {
  constructor(status: number, message: string) {
    super(message, status);
  }
}
