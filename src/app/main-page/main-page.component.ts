import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from '../header/header.component';
import { HeroComponent } from '../hero/hero.component';
import { FeaturesComponent } from '../features/features.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-main-page',
  imports: [RouterOutlet,
    HeaderComponent,
    HeroComponent,
    FeaturesComponent,
    FooterComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent {

}