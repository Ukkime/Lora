import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../login/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  username: string | null = null;
  credits: number | null = null;
  userMenuOpen: boolean = false;
  private userSub: Subscription | null = null;
  private clickListener: any;
  private creditsRequested = false;

  constructor(private router: Router, private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.userSub = this.auth.user$.subscribe((user: { username: string | null, credits: number | null }) => {
      this.username = user.username;
      this.credits = user.credits;
      // Solo pedir créditos una vez tras refrescar
      if (this.username && this.credits === null && !this.creditsRequested) {
        this.creditsRequested = true;
        this.auth.setUser(this.username);
      }
    });
    // Cierra menú al navegar
    this.router.events.subscribe(() => {
      this.userMenuOpen = false;
    });
    // Cierra menú al hacer clic fuera
    this.clickListener = (event: MouseEvent) => {
      const menu = document.querySelector('.user-dropdown');
      if (menu && !menu.contains(event.target as Node)) {
        this.userMenuOpen = false;
      }
    };
    document.addEventListener('mousedown', this.clickListener);
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    document.removeEventListener('mousedown', this.clickListener);
    this.creditsRequested = false;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }
  closeUserMenu() {
    this.userMenuOpen = false;
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.auth.clearTokens();
        this.auth.clearUser();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Incluso si falla, limpia sesión localmente
        this.auth.clearTokens();
        this.auth.clearUser();
        this.router.navigate(['/login']);
      }
    });
  }
}

