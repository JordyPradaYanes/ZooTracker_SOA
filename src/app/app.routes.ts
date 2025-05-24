import { Routes } from '@angular/router';

import {LoginComponent} from './auth/login/login.component';
import { MainPageComponent } from './main-page/main-page.component';
import { InventarioComponent } from './LayoutPriv/inventario/inventario.component';
import { RegistrosComponent } from './LayoutPriv/registros/registros.component';
import { ReportesComponent } from './LayoutPriv/reportes/reportes.component';
import { RegistroComponent } from './auth/registro/registro.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';

export const routes: Routes = [
	{ path: '', component: MainPageComponent},
	{ path: 'regresar', component: MainPageComponent},
	{ path: 'login', component: LoginComponent},
	{ path: 'inventario', component: InventarioComponent},
	{ path: 'registros', component: RegistrosComponent},
	{ path: 'reportes', component: ReportesComponent},
	{ path: 'registro', component: RegistroComponent},
	{ path: 'forgot-password', component: ForgotPasswordComponent},	
	{ path: '**', redirectTo: '' }
];