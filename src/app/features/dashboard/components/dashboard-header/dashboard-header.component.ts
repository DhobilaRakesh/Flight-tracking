import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Theme } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <button
        type="button"
        class="icon-btn menu"
        aria-label="Toggle flights panel"
        [attr.aria-expanded]="sidebarOpen"
        aria-controls="sidebar"
        (click)="menuToggle.emit()"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>

      <div class="brand">
        <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="var(--accent)"/><path d="M16 4l2.2 9.6L27 17v2l-8.8-1.6L17.5 25l3 1.6V28L16 27l-4.5 1v-1.4l3-1.6-.7-7.6L5 19v-2l8.8-3.4z" fill="var(--on-accent)"/></svg>
        <div>
          <h1>Flight Operations</h1>
          <p>Live tracking &amp; operations dashboard</p>
        </div>
      </div>

      <div class="spacer"></div>

      <div class="clock" aria-label="Simulation time">
        <span class="clock-label">{{ playing ? 'SIM' : 'LIVE SNAPSHOT' }}</span>
        <time [attr.datetime]="(now$ | async)?.toISOString()">{{ now$ | async | date: 'HH:mm:ss' : 'UTC' }} <small>UTC</small></time>
      </div>

      <ng-content />

      <button
        type="button"
        class="icon-btn"
        (click)="themeToggle.emit()"
        [attr.aria-pressed]="theme === 'dark'"
        [attr.aria-label]="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        @if (theme === 'dark') {
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        } @else {
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        }
      </button>
    </header>
  `,
  styles: `
    .header {
      height: var(--header-h); display: flex; align-items: center; gap: 14px; padding: 0 16px;
      background: var(--surface); border-bottom: 1px solid var(--border);
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    h1 { margin: 0; font-size: 16px; line-height: 1.2; font-weight: 700; letter-spacing: -0.01em; }
    p { margin: 0; font-size: 11.5px; color: var(--text-muted); }
    .spacer { flex: 1; }
    .clock { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; font-variant-numeric: tabular-nums; }
    .clock-label { font-size: 10px; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 600; }
    time { font-family: var(--mono); font-size: 15px; font-weight: 600; }
    time small { font-size: 10px; color: var(--text-muted); }
    .icon-btn {
      display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 10px;
      background: var(--surface-2); border: 1px solid var(--border); color: var(--text);
    }
    .icon-btn:hover { border-color: var(--accent); }
    .menu { display: none; }
    @media (max-width: 1100px) { .menu { display: inline-grid; } }
    @media (max-width: 720px) { .brand p, .clock { display: none; } }
  `,
})
export class DashboardHeaderComponent {
  @Input({ required: true }) now$!: Observable<Date>;
  @Input() theme: Theme = 'light';
  @Input() playing = false;
  @Input() sidebarOpen = false;
  @Output() themeToggle = new EventEmitter<void>();
  @Output() menuToggle = new EventEmitter<void>();
}
