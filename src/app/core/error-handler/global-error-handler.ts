import { Component, ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;

    if (chunkFailedMessage.test(error.message)) {
      // Chunk loading failed - likely due to deployment
      // Force reload to get new chunks
      if (confirm('A new version is available. Reload to update?')) {
        window.location.reload();
      }
    } else {
      // Log other errors
      console.error('Global error:', error);

      // In production, you could send to error tracking service
      // like Sentry, LogRocket, etc.
    }
  }
}
