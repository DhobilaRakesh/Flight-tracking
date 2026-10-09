import { UrlMatcher, Routes } from '@angular/router';

/**
 * One route handles both `/` and `/flight/:id`, so the dashboard (and its Leaflet map)
 * is never re-created when a flight is selected – only the `id` input changes.
 */
export const dashboardMatcher: UrlMatcher = (segments) => {
  if (segments.length === 0) return { consumed: [] };
  if (segments.length === 2 && segments[0].path === 'flight') {
    return { consumed: segments, posParams: { id: segments[1] } };
  }
  return null;
};

export const routes: Routes = [
  {
    matcher: dashboardMatcher,
    title: 'Flight Operations Dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  { path: '**', redirectTo: '' },
];
