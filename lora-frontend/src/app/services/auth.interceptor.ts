// src/app/services/auth.interceptor.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../modules/core/login/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const debug = environment.debugTokenRefresh;

  const token = localStorage.getItem('token');
  const router = inject(Router);
  const authService = inject(AuthService);

  if (debug) console.log('[AuthInterceptor] Petición interceptada:', req.url, req.method);

  // Función para decodificar el JWT y obtener el exp
  function getTokenExp(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null; // exp en ms
    } catch {
      return null;
    }
  }

  // Si hay token, revisa si expira en menos de 30 min
  if (token) {
    const exp = getTokenExp(token);
    const now = Date.now();
    const FIVE_MIN_MS = 5 * 60 * 1000;
    if (debug) console.log('[AuthInterceptor] Token detectado, expira en', exp ? (exp - now)/1000 : 'desconocido', 'segundos');
    if (exp && exp - now < FIVE_MIN_MS && authService.getRefreshToken()) {
      if (debug) console.log('[AuthInterceptor] Token a punto de expirar, intentando renovación proactiva');
      // Renovar antes de enviar la petición
      return authService.refreshTokens().pipe(
        switchMap((tokens: { token: string; refreshToken: string }) => {
          if (tokens && tokens.token && tokens.refreshToken) {
            if (debug) console.log('[AuthInterceptor] Token renovado automáticamente (proactivo)');
            authService.setTokens(tokens.token, tokens.refreshToken);
            const newReq = req.clone({
              setHeaders: { Authorization: `Bearer ${tokens.token}` }
            });
            return next(newReq);
          } else {
            if (debug) console.warn('[AuthInterceptor] No se pudo renovar el token proactivamente');
            authService.clearUser();
            router.navigate(['/login']);
            return throwError(() => new Error('No se pudo renovar el token'));
          }
        }),
        catchError((err) => {
          if (debug) console.error('[AuthInterceptor] Error en la renovación proactiva:', err);
          authService.clearUser();
          router.navigate(['/login']);
          return throwError(() => new Error('No se pudo renovar el token'));
        })
      );
    } else {
      if (debug) console.log('[AuthInterceptor] Token válido, usando en la petición');
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return next(req).pipe(
    catchError((error) => {
      const errorMsg = error?.error?.message || error?.message || '';
      if (debug) console.warn('[AuthInterceptor] Error detectado en petición:', error.status, errorMsg, 'URL:', req.url);
      if ((error.status === 401 || error.status === 403 || errorMsg.includes('Invalid token.')) && authService.getRefreshToken()) {
        if (debug) console.log('[AuthInterceptor] Intentando renovar token tras error', error.status);
        // Intenta renovar tokens usando RxJS puro
        return authService.refreshTokens().pipe(
          switchMap((tokens: { token: string; refreshToken: string }) => {
            if (tokens && tokens.token && tokens.refreshToken) {
              if (debug) console.log('[AuthInterceptor] Token renovado tras error, reintentando petición');
              authService.setTokens(tokens.token, tokens.refreshToken);
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${tokens.token}` }
              });
              return next(newReq);
            } else {
              if (debug) console.warn('[AuthInterceptor] No se pudo renovar el token tras error');
              authService.clearUser();
              router.navigate(['/login']);
              return throwError(() => error);
            }
          }),
          catchError((err) => {
            if (debug) console.error('[AuthInterceptor] Error renovando tras error:', err);
            authService.clearUser();
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }
      if (debug) console.warn('[AuthInterceptor] Error no gestionado por el interceptor, propagando');
      return throwError(() => error);
    })
  );
};
