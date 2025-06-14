import { Component, type OnInit, type OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  type FormGroup,
  Validators,
} from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import type { User } from '../interface/user.interface';
import type { Subscription } from 'rxjs';
import { HeaderComponent } from '../ComponentesEstructurales/header/header.component';

interface ModalConfig {
  isOpen: boolean;
  mode: 'edit' | 'view';
  title: string;
  user?: User;
}

interface FilterConfig {
  provider: string;
  dateRange: string;
}

interface SortConfig {
  field: 'nombre' | 'correo' | 'fechaCreacion' | 'provider';
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-user-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderComponent],
  templateUrl: './user-crud.component.html',
  styleUrls: [],
})
export class UserCrudComponent implements OnInit, OnDestroy {
  onImageError(event: Event, user: any) {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.style.display = 'none';
      user.photoURL = null; // This will hide the image and show initials
    }
  }
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  processing = false;
  searchTerm = '';

  userForm: FormGroup;

  // Configuración de filtros
  filters: FilterConfig = {
    provider: '',
    dateRange: '',
  };

  // Configuración de ordenamiento
  sortConfig: SortConfig = {
    field: 'fechaCreacion',
    direction: 'desc',
  };

  modalConfig: ModalConfig = {
    isOpen: false,
    mode: 'view',
    title: '',
  };

  notification = {
    show: false,
    type: 'success' as 'success' | 'error' | 'info',
    message: '',
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      telefono: [''],
      photoURL: [''],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // Cargar todos los usuarios
  async loadUsers(): Promise<void> {
    this.loading = true;
    try {
      this.users = await this.userService.getAllUsers();
      this.applyFilters();
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.showNotification('Error al cargar los usuarios', 'error');
    } finally {
      this.loading = false;
    }
  }

  // Aplicar todos los filtros y ordenamiento
  applyFilters(): void {
    let filtered = [...this.users];

    // Filtro por búsqueda de texto
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (user) =>
          user.nombre.toLowerCase().includes(term) ||
          user.correo.toLowerCase().includes(term) ||
          (user.telefono && user.telefono.includes(term))
      );
    }

    // Filtro por provider
    if (this.filters.provider) {
      filtered = filtered.filter(
        (user) => user.provider === this.filters.provider
      );
    }

    // Filtro por rango de fechas
    if (this.filters.dateRange) {
      filtered = this.filterByDateRange(filtered, this.filters.dateRange);
    }

    // Aplicar ordenamiento
    filtered = this.sortUsers(filtered);

    this.filteredUsers = filtered;
  }

  // Filtrar por rango de fechas
  private filterByDateRange(users: User[], range: string): User[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return users.filter((user) => {
      if (!user.fechaCreacion) return false;

      const userDate = new Date(user.fechaCreacion);
      const userDateOnly = new Date(
        userDate.getFullYear(),
        userDate.getMonth(),
        userDate.getDate()
      );

      switch (range) {
        case 'today':
          return userDateOnly.getTime() === today.getTime();

        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return userDateOnly >= weekAgo;

        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return userDateOnly >= monthAgo;

        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return userDateOnly >= yearAgo;

        default:
          return true;
      }
    });
  }

  // Ordenar usuarios
  private sortUsers(users: User[]): User[] {
    return users.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortConfig.field) {
        case 'nombre':
          aValue = a.nombre.toLowerCase();
          bValue = b.nombre.toLowerCase();
          break;
        case 'correo':
          aValue = a.correo.toLowerCase();
          bValue = b.correo.toLowerCase();
          break;
        case 'fechaCreacion':
          aValue = new Date(a.fechaCreacion || 0).getTime();
          bValue = new Date(b.fechaCreacion || 0).getTime();
          break;
        case 'provider':
          aValue = (a.provider || '').toLowerCase();
          bValue = (b.provider || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Cambiar dirección de ordenamiento
  toggleSortDirection(): void {
    this.sortConfig.direction =
      this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  // Limpiar todos los filtros
  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      provider: '',
      dateRange: '',
    };
    this.sortConfig = {
      field: 'fechaCreacion',
      direction: 'desc',
    };
    this.applyFilters();
  }

  // Verificar si hay filtros activos
  hasActiveFilters(): boolean {
    return !!(
      this.filters.provider ||
      this.filters.dateRange ||
      this.searchTerm.trim()
    );
  }

  // Obtener etiqueta del rango de fechas
  getDateRangeLabel(range: string): string {
    const labels: { [key: string]: string } = {
      today: 'Hoy',
      week: 'Esta semana',
      month: 'Este mes',
      year: 'Este año',
    };
    return labels[range] || range;
  }

  // Abrir modal
  openModal(mode: 'edit' | 'view', user?: User): void {
    this.modalConfig = {
      isOpen: true,
      mode,
      title: this.getModalTitle(mode),
      user: user ? { ...user } : undefined,
    };

    // Configurar formulario para edición
    if (mode === 'edit' && user) {
      this.userForm.patchValue({
        nombre: user.nombre,
        telefono: user.telefono || '',
      });
    }
  }

  // Cerrar modal
  closeModal(): void {
    this.modalConfig.isOpen = false;
    this.userForm.reset();
    this.processing = false;
  }

  // Actualizar usuario (solo campos editables)
  async updateUser(): Promise<void> {
    if (this.userForm.invalid || !this.modalConfig.user) {
      this.markFormGroupTouched();
      return;
    }

    this.processing = true;
    try {
      const formData = this.userForm.value;
      const updateData: Partial<User> = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono?.trim() || '',
      };

      const result = await this.userService.updateUser(
        this.modalConfig.user!.uid!,
        updateData
      );

      if (result.success) {
        this.showNotification('Usuario actualizado exitosamente', 'success');
        this.closeModal();
        await this.loadUsers();
      } else {
        this.showNotification(result.message, 'error');
      }
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      this.showNotification('Error inesperado al actualizar usuario', 'error');
    } finally {
      this.processing = false;
    }
  }

  // Obtener título del modal
  private getModalTitle(mode: string): string {
    const titles = {
      edit: 'Editar Usuario',
      view: 'Detalles del Usuario',
    };
    return titles[mode as keyof typeof titles] || '';
  }

  // Marcar campos del formulario como touched
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  // Mostrar notificación
  showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.notification = {
      show: true,
      type,
      message,
    };

    // Auto-hide después de 5 segundos
    setTimeout(() => {
      this.notification.show = false;
    }, 5000);
  }

  // Obtener iniciales del nombre
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  // Formatear fecha
  formatDate(date: Date | any): string {
    if (!date) return 'N/A';

    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  // Obtener usuarios activos (puedes personalizar esta lógica)
  getActiveUsers(): number {
    return this.users.length; // Asumiendo que todos están activos
  }

  // Obtener usuarios creados hoy
  getTodayUsers(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.users.filter((user) => {
      if (!user.fechaCreacion) return false;
      const userDate = new Date(user.fechaCreacion);
      userDate.setHours(0, 0, 0, 0);
      return userDate.getTime() === today.getTime();
    }).length;
  }

  // TrackBy function para optimizar el renderizado de la lista
  trackByUid(index: number, user: User): string {
    return user.uid ?? index.toString();
  }
}
