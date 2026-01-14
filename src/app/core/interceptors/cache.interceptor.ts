import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpResponse,
  HttpEvent,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<any>>();
  private inFlightRequests = new Map<string, Observable<HttpEvent<any>>>();

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // Don't cache auth requests
    if (req.url.includes('/auth/')) {
      return next.handle(req);
    }

    // Check if we have a cached response
    const cachedResponse = this.cache.get(req.url);
    if (cachedResponse) {
      // Check if cache is still valid (5 minutes)
      const cacheTime = cachedResponse.headers.get('X-Cache-Time');
      if (cacheTime) {
        const age = Date.now() - parseInt(cacheTime, 10);
        if (age < 5 * 60 * 1000) {
          return of(cachedResponse.clone());
        }
      }
    }

    // Check if request is already in flight
    const inFlight = this.inFlightRequests.get(req.url);
    if (inFlight) {
      return inFlight;
    }

    // Make the request and cache it
    const shared = next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          // Add cache timestamp
          const response = event.clone({
            headers: event.headers.set('X-Cache-Time', Date.now().toString()),
          });
          this.cache.set(req.url, response);
          this.inFlightRequests.delete(req.url);
        }
      }),
      shareReplay(1)
    );

    this.inFlightRequests.set(req.url, shared);
    return shared;
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearUrl(url: string): void {
    this.cache.delete(url);
  }
}
