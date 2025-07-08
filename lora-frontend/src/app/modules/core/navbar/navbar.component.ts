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
  private userSub: Subscription | null = null;

  constructor(private router: Router, private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.userSub = this.auth.user$.subscribe((user: { username: string | null, credits: number | null }) => {
      this.username = user.username;
      this.credits = user.credits;
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  logout() {
    localStorage.removeItem('token');
    this.auth.clearUser();
    this.router.navigate(['/login']);
  }
}
