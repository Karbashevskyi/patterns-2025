export class FileSystemError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'FileSystemError';
    this.timestamp = new Date();
  }
}

export class FileNotFoundError extends FileSystemError {
  constructor(path, options = {}) {
    super(`File or directory not found: ${path}`, options);
    this.name = 'FileNotFoundError';
    this.path = path;
  }
}

export class PermissionDeniedError extends FileSystemError {
  constructor(operation, options = {}) {
    super(`Permission denied for operation: ${operation}`, options);
    this.name = 'PermissionDeniedError';
    this.operation = operation;
  }
}
export class QuotaExceededError extends FileSystemError {
  constructor(attempted, available, options = {}) {
    super(
      `Storage quota exceeded. Attempted: ${attempted} bytes, Available: ${available} bytes`,
      options
    );
    this.name = 'QuotaExceededError';
    this.attempted = attempted;
    this.available = available;
  }
}

export class FileExistsError extends FileSystemError {
  constructor(path, options = {}) {
    super(`File or directory already exists: ${path}`, options);
    this.name = 'FileExistsError';
    this.path = path;
  }
}

export class ReadError extends FileSystemError {
  constructor(path, options = {}) {
    super(`Failed to read file: ${path}`, options);
    this.name = 'ReadError';
    this.path = path;
  }
}

export class WriteError extends FileSystemError {
  constructor(path, options = {}) {
    super(`Failed to write file: ${path}`, options);
    this.name = 'WriteError';
    this.path = path;
  }
}

export class DeleteError extends FileSystemError {
  constructor(path, options = {}) {
    super(`Failed to delete file: ${path}`, options);
    this.name = 'DeleteError';
    this.path = path;
  }
}

export class NotSupportedError extends FileSystemError {
  constructor(api, options = {}) {
    super(`API not supported in this environment: ${api}`, options);
    this.name = 'NotSupportedError';
    this.api = api;
  }
}

export class BatchOperationError extends AggregateError {
  constructor(errors, operation, options = {}) {
    super(errors, `Batch operation failed: ${operation}`, options);
    this.name = 'BatchOperationError';
    this.operation = operation;
    this.timestamp = new Date();
    this.successCount = 0;
    this.failureCount = errors.length;
  }

  addSuccess() {
    this.successCount++;
  }

  get summary() {
    return {
      operation: this.operation,
      total: this.successCount + this.failureCount,
      succeeded: this.successCount,
      failed: this.failureCount,
      errors: this.errors,
      timestamp: this.timestamp,
    };
  }
}

export function escalateError(error, context = {}) {
  if (!error) return new FileSystemError('Unknown error', context);

  if (error instanceof FileSystemError) return error;

  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotFoundError':
        return new FileNotFoundError(
          context.path || 'unknown',
          { cause: error }
        );
      case 'NotAllowedError':
      case 'SecurityError':
        return new PermissionDeniedError(
          context.operation || 'unknown',
          { cause: error }
        );
      case 'QuotaExceededError':
        return new QuotaExceededError(
          context.attempted || 0,
          context.available || 0,
          { cause: error }
        );
      case 'InvalidModificationError':
        return new FileExistsError(
          context.path || 'unknown',
          { cause: error }
        );
      case 'NotSupportedError':
        return new NotSupportedError(
          context.api || 'unknown',
          { cause: error }
        );
      default:
        return new FileSystemError(
          `File system operation failed: ${error.message}`,
          { cause: error }
        );
    }
  }

  if (error instanceof TypeError) {
    return new NotSupportedError(
      context.api || 'unknown',
      { cause: error }
    );
  }

  return new FileSystemError(
    error.message || 'Unknown error',
    { cause: error }
  );
}

export class ErrorCollector {
  constructor(operation) {
    this.operation = operation;
    this.errors = [];
    this.successCount = 0;
  }

  addError(error, context = {}) {
    const escalated = escalateError(error, context);
    this.errors.push(escalated);
  }

  addSuccess() {
    this.successCount++;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  throwIfErrors() {
    if (this.hasErrors()) {
      const batchError = new BatchOperationError(this.errors, this.operation);
      batchError.successCount = this.successCount;
      throw batchError;
    }
  }

  get summary() {
    return {
      operation: this.operation,
      total: this.successCount + this.errors.length,
      succeeded: this.successCount,
      failed: this.errors.length,
      errors: this.errors,
    };
  }
}
