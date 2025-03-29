import { Routes } from '@angular/router';

import {LoginComponent} from './login/login.component';
import { MainPageComponent } from './main-page/main-page.component';
import { InventarioComponent } from './inventario/inventario.component';
import { RegistrosComponent } from './registros/registros.component';
import { ReportesComponent } from './reportes/reportes.component';

export const routes: Routes = [
	{ path: '', component: MainPageComponent},
	{ path: 'regresar', component: MainPageComponent},
	{ path: 'login', component: LoginComponent},
	{ path: 'inventario', component: InventarioComponent},
	{ path: 'registros', component: RegistrosComponent},
	{ path: 'reportes', component: ReportesComponent},
	{ path: '**', redirectTo: '' }
];