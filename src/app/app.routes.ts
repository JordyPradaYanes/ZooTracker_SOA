import { Routes } from '@angular/router';

import {LoginComponent} from './InicioSesion/login/login.component';
import { MainPageComponent } from './main-page/main-page.component';
import { InventarioComponent } from './inventario/inventario.component';
import { RegistrosComponent } from './registros/registros.component';
import { ReportesComponent } from './reportes/reportes.component';
import { RegistroComponent } from './InicioSesion/registro/registro.component';

export const routes: Routes = [
	{ path: '', component: MainPageComponent},
	{ path: 'regresar', component: MainPageComponent},
	{ path: 'login', component: LoginComponent},
	{ path: 'inventario', component: InventarioComponent},
	{ path: 'registros', component: RegistrosComponent},
	{ path: 'reportes', component: ReportesComponent},
	{ path: 'registro', component: RegistroComponent},
	{ path: '**', redirectTo: '' }
];