'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logClientEvent, reportClientError } from '@/lib/client-logger';
import {
  clearClientSession,
  getStoredUser,
  getStoredSessionToken,
  persistClientSession,
  reconcileEphemeralSession,
  shouldRememberSession,
} from '@/lib/client-session';

type Props = {
  children: React.ReactNode;
};

type ApiEnvelope = {
  success?: boolean;
  data?: unknown;
  message?: string;
  errors?: unknown[] | null;
  meta?: Record<string, unknown>;
};

function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return Boolean(value && typeof value === 'object' && 'success' in value && 'message' in value);
}

function normalizeApiJson(payload: unknown) {
  if (!isApiEnvelope(payload)) {
    return payload;
  }

  if (payload.success === false) {
    return {
      error: payload.message,
      message: payload.message,
      errors: payload.errors ?? null,
      meta: payload.meta ?? null,
    };
  }

  if (Array.isArray(payload.data)) {
    return Object.assign(payload.data, {
      message: payload.message,
      meta: payload.meta ?? null,
    });
  }

  if (payload.data && typeof payload.data === 'object') {
    return {
      ...(payload.data as Record<string, unknown>),
      message: payload.message,
      meta: payload.meta ?? null,
    };
  }

  if (payload.data === null || payload.data === undefined) {
    return {
      message: payload.message,
      meta: payload.meta ?? null,
    };
  }

  return {
    data: payload.data,
    message: payload.message,
    meta: payload.meta ?? null,
  };
}

function isApiRoute(url: URL) {
  return url.origin === window.location.origin && url.pathname.startsWith('/api/');
}

export function AppRuntimeProvider({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    reconcileEphemeralSession();

    const originalFetch = window.fetch.bind(window);
    let refreshPromise: Promise<string | null> | null = null;
    const routePromises = new Map<string, Promise<{ status: number; payload: unknown } | null>>();
    const routeCache = new Map<string, { status: number; payload: unknown; cachedAt: number }>();

    function createJsonResponse(status: number, payload: unknown) {
      return new Response(JSON.stringify(payload), {
        status,
        headers: {
          'content-type': 'application/json',
        },
      });
    }

    async function refreshAccessToken() {
      if (refreshPromise) return refreshPromise;

      refreshPromise = (async () => {
        try {
          const response = await originalFetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (!response.ok) {
            clearClientSession();
            return null;
          }

          const payload = normalizeApiJson(await response.json()) as Record<string, unknown> | null;
          const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken : null;
          if (accessToken) {
            persistClientSession({
              accessToken,
              user: payload?.user ?? getStoredUser(),
              rememberMe: shouldRememberSession(),
            });
          }
          return accessToken;
        } catch (error) {
          reportClientError(error, { action: 'refresh_access_token' });
          return null;
        } finally {
          refreshPromise = null;
        }
      })();

      return refreshPromise;
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      // Direct bypass for upload API to prevent multipart boundary stripping
      const targetUrl = typeof input === 'string' 
        ? input 
        : (input instanceof URL ? input.toString() : input.url);
      
      let isSameOriginUpload = false;
      try {
        const parsedUrl = new URL(targetUrl, window.location.origin);
        isSameOriginUpload = parsedUrl.origin === window.location.origin && parsedUrl.pathname.startsWith('/api/upload');
      } catch (err) {
        console.warn('Failed to parse URL in fetch bypass:', err);
      }
      
      if (isSameOriginUpload) {
        const token = getStoredSessionToken();
        const nextInit = { ...init };
        const headersObj: Record<string, string> = {};
        
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((val, key) => {
              headersObj[key] = val;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, val]) => {
              headersObj[key] = val;
            });
          } else {
            Object.assign(headersObj, init.headers);
          }
        }
        
        // Remove any existing content-type headers so the browser generates the boundary
        for (const key of Object.keys(headersObj)) {
          if (key.toLowerCase() === 'content-type') {
            delete headersObj[key];
          }
        }
        
        if (token && !headersObj['Authorization'] && !headersObj['authorization']) {
          headersObj['Authorization'] = `Bearer ${token}`;
        }
        
        nextInit.headers = headersObj;
        return originalFetch(input, nextInit);
      }

      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url, window.location.origin);
      const nextHeaders = new Headers(request.headers);
      const isSameApiRoute = isApiRoute(url);
      const isAuthRefresh = url.pathname === '/api/auth/refresh';
      const isAuthLogin = url.pathname === '/api/auth/login';
      const isForgotPasswordFlow = url.pathname.startsWith('/api/auth/forgot-password/');
      
      const path = url.pathname;
      const isAuthMe = path === '/api/auth/me';
      const isGet = request.method.toUpperCase() === 'GET';
      const cacheableRoutes = [
        '/api/auth/me',
        '/api/company-settings',
        '/api/business-settings',
        '/api/workspace-settings',
        '/api/dashboard/stats/workforce',
      ];
      const isCacheable = isSameApiRoute && isGet && cacheableRoutes.includes(path);
      const token = getStoredSessionToken();

      if (isSameApiRoute && token && !nextHeaders.has('Authorization') && !isAuthRefresh && !isAuthLogin) {
        nextHeaders.set('Authorization', `Bearer ${token}`);
      }

      // WARNING: When uploading files (FormData), `new Request()` binds a random boundary to the Content-Type.
      // If we blindly pass this frozen boundary via `nextHeaders` to `originalFetch`, it will mismatch the newly
      // generated boundary for the actual payload, causing 500 "no boundary found" errors.
      if (init?.body instanceof FormData || request.body instanceof FormData) {
        nextHeaders.delete('content-type');
        nextHeaders.delete('Content-Type');
      }

      const doFetch = () => originalFetch(input, {
        ...init,
        headers: nextHeaders,
        credentials: init?.credentials ?? 'include',
      });

      if (isCacheable) {
        const cached = routeCache.get(path);
        if (cached && Date.now() - cached.cachedAt < 2000) {
          return createJsonResponse(cached.status, cached.payload);
        }

        const activePromise = routePromises.get(path);
        if (activePromise) {
          const resolved = await activePromise;
          if (resolved) {
            return createJsonResponse(resolved.status, resolved.payload);
          }
        }
      }

      let response = await doFetch();

      if (isCacheable && response.headers.get('content-type')?.includes('application/json')) {
        const clonedResponse = response.clone();
        const promise = clonedResponse
          .json()
          .then((payload) => {
            routeCache.set(path, {
              status: response.status,
              payload,
              cachedAt: Date.now(),
            });
            return {
              status: response.status,
              payload,
            };
          })
          .catch(() => null)
          .finally(() => {
            routePromises.delete(path);
          });

        routePromises.set(path, promise);
      }

      if (isSameApiRoute && response.status === 401 && token && !isAuthRefresh && !isAuthLogin) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          nextHeaders.set('Authorization', `Bearer ${refreshedToken}`);
          response = await doFetch();
        }
      }

      if (isSameApiRoute && response.status === 403) {
        toast.error('You no longer have access to this page. Please sign in again.');
        router.push('/login');
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const originalJson = response.json.bind(response);
        response.json = async () => normalizeApiJson(await originalJson());

        if (!response.ok) {
          response.clone().json()
            .then((payload) => {
              const normalized = normalizeApiJson(payload) as Record<string, unknown>;
              const message = typeof normalized?.error === 'string'
                ? normalized.error
                : typeof normalized?.message === 'string'
                  ? normalized.message
                  : 'Request failed';

              const safeMessage = isAuthLogin
                ? 'Unable to sign in. Please check your credentials and try again.'
                : isForgotPasswordFlow
                  ? 'Unable to complete this request right now. Please try again.'
                  : message;

              if (!isAuthRefresh && !isAuthLogin && !isAuthMe) {
                toast.error(safeMessage);
              }

              logClientEvent('warn', 'api_request_failed', {
                status: response.status,
                path: url.pathname,
                message: safeMessage,
              });
            })
            .catch(() => undefined);
        }
      }

      return response;
    };

    const handleUnhandledError = (event: ErrorEvent) => {
      reportClientError(event.error ?? event.message, { source: 'window.onerror' });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportClientError(event.reason, { source: 'unhandledrejection' });
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [router]);

  return children;
}
