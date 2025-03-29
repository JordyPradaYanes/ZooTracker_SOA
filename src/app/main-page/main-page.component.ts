import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { HeaderComponent } from '../header/header.component';
import { HeroComponent } from '../hero/hero.component';
import { FeaturesComponent } from '../features/features.component';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [RouterOutlet,
    HeaderComponent,
    HeroComponent,
    FeaturesComponent,
    FooterComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})


export class MainPageComponent implements OnInit {
  isLoggedIn!: boolean;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isLoggedIn.subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
    });
  }
}