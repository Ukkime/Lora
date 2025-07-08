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

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password })
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
