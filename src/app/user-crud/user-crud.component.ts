import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { User, CreateUserData } from '../interface/user.interface';
import { Subscription } from 'rxjs';

interface ModalConfig {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view' | 'delete';
  title: string;
  user?: User;
}

@Component({
  selector: 'app-user-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-crud.component.html',
  styleUrls: []
})
export class UserCrudComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  processing = false;
  searchTerm = '';
  
  userForm: FormGroup;
  
  modalConfig: ModalConfig = {
    isOpen: false,
    mode: 'create',
    title: ''
  };

  notification = {
    show: false,
    type: 'success' as 'success' | 'error' | 'info',
    message: ''
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [''],
      contraseña: ['', [Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Cargar todos los usuarios
  async loadUsers(): Promise<void> {
    this.loading = true;
    try {
      this.users = await this.userService.getAllUsers();
      this.filteredUsers = [...this.users];
      this.filterUsers(); // Aplicar filtro actual si existe
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.showNotification('Error al cargar los usuarios', 'error');
    } finally {
      this.loading = false;
    }
  }

  // Filtrar usuarios por término de búsqueda
  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = this.users.filter(user =>
      user.nombre.toLowerCase().includes(term) ||
      user.correo.toLowerCase().includes(term) ||
      (user.telefono && user.telefono.includes(term))
    );
  }

  // Abrir modal
  openModal(mode: 'create' | 'edit' | 'view' | 'delete', user?: User): void {
    this.modalConfig = {
      isOpen: true,
      mode,
      title: this.getModalTitle(mode),
      user: user ? { ...user } : undefined
    };

    // Configurar formulario según el modo
    if (mode === 'create') {
      this.userForm.reset();
      this.userForm.get('contraseña')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.get('contraseña')?.updateValueAndValidity();
    } else if (mode === 'edit' && user) {
      this.userForm.patchValue({
        nombre: user.nombre,
        correo: user.correo,
        telefono: user.telefono || ''
      });
      this.userForm.get('contraseña')?.clearValidators();
      this.userForm.get('contraseña')?.updateValueAndValidity();
    }
  }

  // Cerrar modal
  closeModal(): void {
    this.modalConfig.isOpen = false;
    this.userForm.reset();
    this.processing = false;
  }

  // Crear usuario
  async createUser(): Promise<void> {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.processing = true;
    try {
      const formData = this.userForm.value;
      const userData: CreateUserData = {
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim(),
        telefono: formData.telefono?.trim() || '',
        contraseña: formData.contraseña
      };

      const result = await this.userService.createUser(userData);
      
      if (result.success) {
        this.showNotification('Usuario creado exitosamente', 'success');
        this.closeModal();
        await this.loadUsers();
      } else {
        this.showNotification(result.message, 'error');
      }
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      this.showNotification('Error inesperado al crear usuario', 'error');
    } finally {
      this.processing = false;
    }
  }

  // Actualizar usuario
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
        correo: formData.correo.trim(),
        telefono: formData.telefono?.trim() || ''
      };

      const result = await this.userService.updateUser(this.modalConfig.user!.uid!, updateData);
      
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

  // Eliminar usuario
  async deleteUser(): Promise<void> {
    if (!this.modalConfig.user) return;

    this.processing = true;
    try {
      const result = await this.userService.deleteUser(this.modalConfig.user.uid!);
      
      if (result.success) {
        this.showNotification('Usuario eliminado exitosamente', 'success');
        this.closeModal();
        await this.loadUsers();
      } else {
        this.showNotification(result.message, 'error');
      }
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      this.showNotification('Error inesperado al eliminar usuario', 'error');
    } finally {
      this.processing = false;
    }
  }

  // Obtener título del modal
  private getModalTitle(mode: string): string {
    const titles = {
      create: 'Crear Nuevo Usuario',
      edit: 'Editar Usuario',
      view: 'Detalles del Usuario',
      delete: 'Confirmar Eliminación'
    };
    return titles[mode as keyof typeof titles] || '';
  }

  // Marcar campos del formulario como touched
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  // Mostrar notificación
  showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.notification = {
      show: true,
      type,
      message
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
      .map(word => word.charAt(0))
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
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  // Obtener usuarios creados hoy
  getTodayUsers(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.users.filter(user => {
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