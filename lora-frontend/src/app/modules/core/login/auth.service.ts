import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<{ username: string | null, credits: number | null }>({ username: null, credits: null });
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initUserFromToken();
  }
  private apiUrl = 'http://localhost:3000/api/auth'; // Prefijo correcto para autenticación

  // === MÉTODOS PARA TOKENS ===
  getAccessToken(): string | null {
    return localStorage.getItem('token');
  }
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
  setTokens(token: string, refreshToken: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    this.initUserFromToken();
  }
  clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Llama al backend para renovar tokens usando el refresh token
   */
  refreshTokens(): Observable<{ token: string, refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ token: string, refreshToken: string }>(`${this.apiUrl}/refresh`, { refreshToken });
  }

  /**
   * Inicializa el usuario desde el token si existe al crear el servicio
   */
  private initUserFromToken() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.setUser(payload.username);
      } catch {
        this.clearUser();
      }
    } else {
      this.clearUser();
    }
  }

  /**
   * Llama después de login para establecer usuario y cargar créditos
   */
  setUser(username: string) {
    this.userSubject.next({ username, credits: null });
    // Cargar créditos si hay username
    if (username) {
      this.http.get<{ credits: number }>('http://localhost:3000/api/users/me/credits').subscribe({
        next: (res) => this.userSubject.next({ username, credits: res.credits }),
        error: () => this.userSubject.next({ username, credits: null })
      });
    }
  }

  /**
   * Limpia el estado de usuario (logout)
   */
  clearUser() {
    this.userSubject.next({ username: null, credits: null });
  }

  /**
   * Llama al backend para hacer logout y revocar el refresh token
   */
  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post(`${this.apiUrl}/logout`, { refreshToken }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene sesiones activas del usuario
   */
  getSessions(): Observable<any[]> {
    const token = this.getAccessToken();
    return this.http.get<any[]>(`${this.apiUrl}/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(catchError(this.handleError));
  }

  /**
   * Revoca todas las sesiones activas (logout global)
   */
  logoutAllSessions(): Observable<any> {
    const token = this.getAccessToken();
    return this.http.post(`${this.apiUrl}/logout-all`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(catchError(this.handleError));
  }

  /**
   * Revoca una sesión individual
   */
  revokeSession(sessionId: number): Observable<any> {
    const token = this.getAccessToken();
    return this.http.post(`${this.apiUrl}/revoke-session`, { sessionId }, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(catchError(this.handleError));
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string, refreshToken: string }>(`${this.apiUrl}/login`, { username, password })
      .pipe(catchError(this.handleError));
  }

  register(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, password })
      .pipe(catchError(this.handleError));
  }

  /**
   * Permite que otros componentes actualicen el estado si el token cambia manualmente
   */
  refreshUserFromToken() {
    this.initUserFromToken();
  }

  private handleError(error: HttpErrorResponse) {
    let msg = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      msg = `Error: ${error.error.message}`;
    } else if (error.error && error.error.message) {
      msg = error.error.message;
    } else {
      msg = `Código: ${error.status}, Mensaje: ${error.message}`;
    }
    return throwError(() => msg);
  }
}
