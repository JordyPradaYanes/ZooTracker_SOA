import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { AuditService } from "../services/audit.service"
import { AuthService } from "../services/auth.service"
import { type AuditLog, AuditAction, type AuditFilters } from "../interface/audit.interface"
import { HeaderComponent } from "../ComponentesEstructurales/header/header.component"

// Interfaz para el ordenamiento
interface SortConfig {
  field: 'fechaHora' | 'nombre' | null;
  direction: 'asc' | 'desc';
}

@Component({
  selector: "app-audit",
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: "./audit.component.html",
  styleUrls: ["./audit.component.css"],
})
export class AuditComponent implements OnInit {
  [x: string]: any
  auditLogs: AuditLog[] = []
  filteredLogs: AuditLog[] = []
  isLoading = false
  currentUser: any = null

  // Filtros
  filters: AuditFilters = {}
  searchNombre = ""
  selectedAction = ""
  fechaInicio = ""
  fechaFin = ""

  // NUEVO: Configuración de ordenamiento
  sortConfig: SortConfig = {
    field: null,
    direction: 'asc'
  }

  // Opciones de acciones para el filtro
  auditActions = Object.values(AuditAction)

  // Paginación
  currentPage = 1
  itemsPerPage = 10
  totalPages = 0

  // Estadísticas
  stats: { [key: string]: number } = {}
  Math: any

  constructor(
    private auditService: AuditService,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user
    })

    await this.loadAuditLogs()
    await this.loadStats()

    await this.logComponentAction(AuditAction.PROFILE_VIEW, "Acceso a página de auditoría")
  }

  private async logComponentAction(action: AuditAction, details: string): Promise<void> {
    if (this.currentUser) {
      try {
        const userName = this.currentUser.displayName || this.currentUser.email || "Usuario desconocido"
        await this.auditService.logAuditEvent({
          uid: this.currentUser.uid,
          nombre: userName,
          accion: action,
          detalles: details,
        })
      } catch (error) {
        console.error("Error al registrar acción del componente:", error)
      }
    }
  }

  // NUEVO: Método para ordenar los datos
  sortData(field: 'fechaHora' | 'nombre'): void {
    if (this.sortConfig.field === field) {
      // Si ya está ordenado por este campo, cambiar dirección
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc'
    } else {
      // Si es un campo nuevo, ordenar ascendente
      this.sortConfig.field = field
      this.sortConfig.direction = 'asc'
    }

    this.applySorting()
    this.calculatePagination()
    this.currentPage = 1

    // Registrar acción de ordenamiento
    this.logComponentAction(
      AuditAction.PROFILE_VIEW, 
      `Ordenamiento aplicado: ${field} ${this.sortConfig.direction}`
    )
  }

  // NUEVO: Aplicar ordenamiento a los datos filtrados
  private applySorting(): void {
    if (!this.sortConfig.field) return

    this.filteredLogs.sort((a, b) => {
      let valueA: any
      let valueB: any

      switch (this.sortConfig.field) {
        case 'fechaHora':
          valueA = new Date(a.fechaHora).getTime()
          valueB = new Date(b.fechaHora).getTime()
          break
        case 'nombre':
          valueA = a.nombre.toLowerCase()
          valueB = b.nombre.toLowerCase()
          break
        default:
          return 0
      }

      if (valueA < valueB) {
        return this.sortConfig.direction === 'asc' ? -1 : 1
      }
      if (valueA > valueB) {
        return this.sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  // NUEVO: Obtener el icono de ordenamiento para un campo
  getSortIcon(field: 'fechaHora' | 'nombre'): string {
    if (this.sortConfig.field !== field) {
      return 'sort' // Icono neutral
    }
    return this.sortConfig.direction === 'asc' ? 'sort-up' : 'sort-down'
  }

  // NUEVO: Verificar si un campo está siendo ordenado
  isSorted(field: 'fechaHora' | 'nombre'): boolean {
    return this.sortConfig.field === field
  }

  // NUEVO: Limpiar ordenamiento
  clearSort(): void {
    this.sortConfig = {
      field: null,
      direction: 'asc'
    }
    this.applyFilters() // Reaplica filtros sin ordenamiento
  }

  async loadAuditLogs() {
    this.isLoading = true
    try {
      this.auditLogs = await this.auditService.getAuditLogs(this.filters, 500)
      this.applyFilters()

      await this.logComponentAction(AuditAction.PROFILE_VIEW, "Carga de logs de auditoría")
    } catch (error) {
      console.error("Error al cargar logs:", error)
    } finally {
      this.isLoading = false
    }
  }

  async loadStats() {
    this.stats = await this.auditService.getAuditStats()
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  getInitials(nombre: string): string {
    return nombre
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  getActionEmoji(action: AuditAction): string {
    const emojis: { [key: string]: string } = {
      [AuditAction.LOGIN]: "🔐",
      [AuditAction.LOGOUT]: "🚪",
      [AuditAction.CREATE]: "➕",
      [AuditAction.UPDATE]: "✏️",
      [AuditAction.DELETE]: "🗑️",
      [AuditAction.PASSWORD_CHANGE]: "🔑",
      [AuditAction.PROFILE_VIEW]: "👁️",
    }
    return emojis[action] || "📝"
  }

  getPercentage(action: string): number {
    const total = this.filteredLogs.length
    if (total === 0) return 0
    const count = this.stats[action] || 0
    return Math.round((count / total) * 100)
  }

  getActiveFiltersCount(): number {
    let count = 0
    if (this.searchNombre?.trim()) count++
    if (this.selectedAction) count++
    if (this.fechaInicio) count++
    if (this.fechaFin) count++
    return count
  }

  // MODIFICADO: Aplicar filtros y luego ordenamiento
  async applyFilters() {
    let filtered = [...this.auditLogs]

    // Filtro por nombre
    if (this.searchNombre.trim()) {
      const searchTerm = this.searchNombre.toLowerCase().trim()
      filtered = filtered.filter((log) => log.nombre.toLowerCase().includes(searchTerm))
    }

    // Filtro por acción
    if (this.selectedAction) {
      filtered = filtered.filter((log) => log.accion === this.selectedAction)
    }

    // Filtro por fecha de inicio
    if (this.fechaInicio) {
      const fechaInicioDate = new Date(this.fechaInicio)
      filtered = filtered.filter((log) => log.fechaHora >= fechaInicioDate)
    }

    // Filtro por fecha de fin
    if (this.fechaFin) {
      const fechaFinDate = new Date(this.fechaFin)
      fechaFinDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((log) => log.fechaHora <= fechaFinDate)
    }

    this.filteredLogs = filtered
    
    // NUEVO: Aplicar ordenamiento después de filtrar
    this.applySorting()
    
    this.calculatePagination()
    this.currentPage = 1

    const filterDetails = `Filtros aplicados - Nombre: ${this.searchNombre || "N/A"}, Acción: ${this.selectedAction || "N/A"}, Fecha inicio: ${this.fechaInicio || "N/A"}, Fecha fin: ${this.fechaFin || "N/A"}`
    await this.logComponentAction(AuditAction.PROFILE_VIEW, filterDetails)
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage)
  }

  get paginatedLogs(): AuditLog[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    return this.filteredLogs.slice(startIndex, endIndex)
  }

  async changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      await this.logComponentAction(AuditAction.PROFILE_VIEW, `Navegación a página ${page} de auditoría`)
    }
  }

  // MODIFICADO: Limpiar filtros y ordenamiento
  async clearFilters() {
    this.searchNombre = ""
    this.selectedAction = ""
    this.fechaInicio = ""
    this.fechaFin = ""
    this.filters = {}
    
    // NUEVO: También limpiar ordenamiento
    this.clearSort()
    
    this.applyFilters()

    await this.logComponentAction(AuditAction.UPDATE, "Filtros y ordenamiento limpiados")
  }

  formatDate(date: Date): string {
    return this.auditService.formatDate(date)
  }

  getActionClass(action: AuditAction): string {
    const classes: { [key: string]: string } = {
      [AuditAction.LOGIN]: "bg-green-100 text-green-800",
      [AuditAction.LOGOUT]: "bg-gray-100 text-gray-800",
      [AuditAction.CREATE]: "bg-blue-100 text-blue-800",
      [AuditAction.UPDATE]: "bg-yellow-100 text-yellow-800",
      [AuditAction.DELETE]: "bg-red-100 text-red-800",
      [AuditAction.PASSWORD_CHANGE]: "bg-purple-100 text-purple-800",
      [AuditAction.PROFILE_VIEW]: "bg-indigo-100 text-indigo-800",
    }
    return classes[action] || "bg-gray-100 text-gray-800"
  }

  translateAction(action: AuditAction): string {
    const translations: { [key: string]: string } = {
      [AuditAction.LOGIN]: "Inicio de Sesión",
      [AuditAction.LOGOUT]: "Cierre de Sesión",
      [AuditAction.CREATE]: "Creación",
      [AuditAction.UPDATE]: "Actualización",
      [AuditAction.DELETE]: "Eliminación",
      [AuditAction.PASSWORD_CHANGE]: "Cambio de Contraseña",
      [AuditAction.PROFILE_VIEW]: "Vista de Perfil",
    }
    return translations[action] || action
  }

  get pageNumbers(): number[] {
    const pages: number[] = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  async exportToCSV() {
    const headers = ["Fecha y Hora", "Usuario", "Acción", "Detalles", "IP"]
    const csvData = this.filteredLogs.map((log) => [
      this.formatDate(log.fechaHora),
      log.nombre,
      this.translateAction(log.accion),
      log.detalles || "",
      log.ipAddress || "",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    await this.logComponentAction(
      AuditAction.PROFILE_VIEW,
      `Exportación de ${this.filteredLogs.length} registros de auditoría a CSV`,
    )
  }

  async refresh() {
    await this.loadAuditLogs()
    await this.loadStats()
    await this.logComponentAction(AuditAction.UPDATE, "Actualización manual de datos de auditoría")
  }

  trackByLogId(index: number, log: AuditLog): string {
    return log.id || index.toString()
  }
}