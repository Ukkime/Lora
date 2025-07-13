import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isRegisterMode: boolean = false;
  loading: boolean = false;
  message: string = '';
  error: string = '';

  // disabled by default
  showPresentation: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  onPresentationFinished() {
    this.showPresentation = false;
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.message = '';
    this.error = '';
  }

  login() {
    this.loading = true;
    this.error = '';
    this.message = '';
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.message = '¡Login correcto!';
        if (res && res.token && res.refreshToken) {
          this.authService.setTokens(res.token, res.refreshToken);
          // Decodificar el username y actualizar el estado global
          try {
            const payload = JSON.parse(atob(res.token.split('.')[1]));
            this.authService.setUser(payload.username);
          } catch {}
        }
        this.router.navigate(['/mis-cartas']);
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }

    });
  }

  register() {
    this.loading = true;
    this.error = '';
    this.message = '';
    this.authService.register(this.username, this.password).subscribe({
      next: (res) => {
        this.message = '¡Registro exitoso! Ahora puedes iniciar sesión.';
        this.isRegisterMode = false;
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}

