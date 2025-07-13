import { Component, OnInit } from '@angular/core';
import { AuthService } from '../login/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.css'],
  imports: [CommonModule]
})
export class SessionsComponent implements OnInit {
  sessions: any[] = [];
  loading = false;
  error: string | null = null;
  currentRefreshToken: string | null = null;
  logoutAllLoading = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.currentRefreshToken = this.auth.getRefreshToken();
    this.fetchSessions();
  }

  fetchSessions() {
    this.loading = true;
    this.error = null;
    this.auth.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.loading = false;
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      }
    });
  }

  logoutAll() {
    if (!confirm('¿Seguro que quieres cerrar todas las sesiones?')) return;
    this.logoutAllLoading = true;
    this.auth.logoutAllSessions().subscribe({
      next: () => {
        this.auth.clearTokens();
        this.auth.clearUser();
        window.location.href = '/login';
      },
      error: (err) => {
        this.error = err;
        this.logoutAllLoading = false;
      }
    });
  }

  isCurrentSession(token: string) {
    return token === this.currentRefreshToken;
  }

  revokeSession(sessionId: number) {
    if (!confirm('¿Seguro que quieres cerrar esta sesión?')) return;
    // Busca el token de la sesión a cerrar
    const session = this.sessions.find(s => s.id === sessionId);
    const isCurrent = session && this.isCurrentSession(session.token);
    this.auth.revokeSession(sessionId).subscribe({
      next: () => {
        if (isCurrent) {
          this.auth.clearTokens();
          this.auth.clearUser();
          window.location.href = '/login';
        } else {
          this.fetchSessions();
        }
      },
      error: (err) => this.error = err
    });
  }
}
