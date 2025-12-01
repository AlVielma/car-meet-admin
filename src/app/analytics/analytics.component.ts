import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  effect,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { ENV } from '../core/config/env';

Chart.register(...registerables);

type EventAttendance = { name: string; totalParticipants: number };
type CarStats = { brand: string; model: string; year: number; _count: { id: number } };
type RoleDistribution = { roleName: string; totalUsers: number };
type TopCar = { brand: string; model: string; year: number; _count: { votes: number } };
type PhotoSummary = { type: string; _count: { id: number } };

@Component({
  selector: 'app-analytics',
  template: `
    <div class="row g-4">
      <div class="col-12">
        <h1 class="h4 mb-3">Analítica</h1>
        <p class="text-muted">Estadísticas generales del sistema.</p>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card shadow-sm">
          <div class="card-body chart-container">
            <h2 class="h6 mb-3">Asistencia por evento</h2>
            <canvas id="attendanceChart"></canvas>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card shadow-sm">
          <div class="card-body chart-container">
            <h2 class="h6 mb-3">Autos por marca/modelo/año</h2>
            <canvas id="carsChart"></canvas>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card shadow-sm">
          <div class="card-body chart-container">
            <h2 class="h6 mb-3">Distribución de roles</h2>
            <canvas id="rolesChart"></canvas>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card shadow-sm">
          <div class="card-body chart-container">
            <h2 class="h6 mb-3">Top 10 autos con más votos</h2>
            <canvas id="topCarsChart"></canvas>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-body chart-container">
            <h2 class="h6 mb-3">Fotos agrupadas por tipo</h2>
            <canvas id="photosChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block py-4' },
})
export class AnalyticsComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly http = inject(HttpClient);

  attendance = signal<EventAttendance[]>([]);
  carsStats = signal<CarStats[]>([]);
  roles = signal<RoleDistribution[]>([]);
  topCars = signal<TopCar[]>([]);
  photos = signal<PhotoSummary[]>([]);

  private attendanceChart?: Chart;
  private carsChart?: Chart;
  private rolesChart?: Chart;
  private topCarsChart?: Chart;
  private photosChart?: Chart;

  constructor() {
    effect(() => this.renderAttendanceChart());
    effect(() => this.renderCarsChart());
    effect(() => this.renderRolesChart());
    effect(() => this.renderTopCarsChart());
    effect(() => this.renderPhotosChart());

    this.loadFromApi();
  }

  async loadFromApi() {
    try {
      const [attendance, carsStats, roles, topCars, photos] = await Promise.all([
        this.http.get<any[]>(`${ENV.apiBaseUrl}/analytics/attendance`).toPromise(),
        this.http.get<any[]>(`${ENV.apiBaseUrl}/analytics/cars-stats`).toPromise(),
        this.http.get<any[]>(`${ENV.apiBaseUrl}/analytics/roles-distribution`).toPromise(),
        this.http.get<any[]>(`${ENV.apiBaseUrl}/analytics/top-cars`).toPromise(),
        this.http.get<any[]>(`${ENV.apiBaseUrl}/analytics/photos-summary`).toPromise(),
      ]);
      if (attendance) this.attendance.set(attendance);
      if (carsStats) this.carsStats.set(carsStats);
      if (roles) this.roles.set(roles);
      if (topCars) this.topCars.set(topCars);
      if (photos) this.photos.set(photos);
    } catch (e) {
      // Puedes mostrar un mensaje de error aquí si lo deseas
    }
  }

  private renderAttendanceChart() {
    const canvas = this.query<HTMLCanvasElement>('attendanceChart');
    if (!canvas) return;
    const data = this.attendance();
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: data.map((ev) => ev.name),
        datasets: [
          {
            label: 'Participantes',
            data: data.map((ev) => ev.totalParticipants),
            backgroundColor: 'rgba(13,110,253,0.6)',
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
    this.attendanceChart?.destroy();
    this.attendanceChart = new Chart(canvas.getContext('2d')!, config);
  }

  private renderCarsChart() {
    const canvas = this.query<HTMLCanvasElement>('carsChart');
    if (!canvas) return;
    const data = this.carsStats();
    const labels = data.map((c) => `${c.brand} ${c.model} ${c.year}`);
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Cantidad',
            data: data.map((c) => c._count.id),
            backgroundColor: 'rgba(25,135,84,0.6)',
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
    this.carsChart?.destroy();
    this.carsChart = new Chart(canvas.getContext('2d')!, config);
  }

  private renderRolesChart() {
    const canvas = this.query<HTMLCanvasElement>('rolesChart');
    if (!canvas) return;
    const data = this.roles();
    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: data.map((r) => r.roleName),
        datasets: [
          {
            label: 'Usuarios',
            data: data.map((r) => r.totalUsers),
            backgroundColor: [
              'rgba(13,110,253,0.6)',
              'rgba(220,53,69,0.6)',
              'rgba(255,193,7,0.6)',
              'rgba(25,135,84,0.6)',
              'rgba(108,117,125,0.6)',
            ],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
    this.rolesChart?.destroy();
    this.rolesChart = new Chart(canvas.getContext('2d')!, config);
  }

  private renderTopCarsChart() {
    const canvas = this.query<HTMLCanvasElement>('topCarsChart');
    if (!canvas) return;
    const data = this.topCars();
    const labels = data.map((c) => `${c.brand} ${c.model} ${c.year}`);
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Votos',
            data: data.map((c) => c._count.votes),
            backgroundColor: 'rgba(220,53,69,0.6)',
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
    this.topCarsChart?.destroy();
    this.topCarsChart = new Chart(canvas.getContext('2d')!, config);
  }

  private renderPhotosChart() {
    const canvas = this.query<HTMLCanvasElement>('photosChart');
    if (!canvas) return;
    const data = this.photos();
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.map((p) => p.type),
        datasets: [
          {
            label: 'Fotos',
            data: data.map((p) => p._count.id),
            backgroundColor: [
              'rgba(13,110,253,0.6)',
              'rgba(220,53,69,0.6)',
              'rgba(255,193,7,0.6)',
              'rgba(25,135,84,0.6)',
              'rgba(108,117,125,0.6)',
            ],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    };
    this.photosChart?.destroy();
    this.photosChart = new Chart(canvas.getContext('2d')!, config);
  }

  private query<T extends HTMLElement>(id: string): T | null {
    return this.el.nativeElement.querySelector(`#${id}`) as T | null;
  }
}
