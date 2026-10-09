import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PLAYBACK_SPEEDS, PlaybackSpeed } from '../../../../core/services/flight.service';

@Component({
  selector: 'app-playback-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pb" role="group" aria-label="Flight simulation playback">
      <button type="button" class="play" (click)="toggle.emit()" [attr.aria-pressed]="playing">
        @if (playing) {
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
          Pause
        } @else {
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>
          Play
        }
      </button>
      <label class="speed">
        <span class="visually-hidden">Playback speed</span>
        <select [value]="speed" (change)="onSpeed($any($event.target).value)">
          @for (s of speeds; track s) {
            <option [value]="s" [selected]="s === speed">{{ s === 1 ? '1× (real time)' : s + '×' }}</option>
          }
        </select>
      </label>
      <button type="button" class="reset" (click)="restart.emit()" aria-label="Restart simulation">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
      </button>
    </div>
  `,
  styles: `
    .pb { display: flex; align-items: center; gap: 6px; }
    button, select {
      height: 40px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface-2); padding: 0 12px; font-weight: 600; font-size: 13px;
    }
    button:hover, select:hover { border-color: var(--accent); }
    .play { display: inline-flex; align-items: center; gap: 7px; background: var(--accent); color: var(--on-accent); border-color: var(--accent); min-width: 86px; justify-content: center; }
    .reset { width: 40px; padding: 0; display: inline-grid; place-items: center; }
    @media (max-width: 720px) { select { display: none; } }
  `,
})
export class PlaybackControlsComponent {
  @Input() playing = false;
  @Input() speed: PlaybackSpeed = 300;
  @Output() toggle = new EventEmitter<void>();
  @Output() restart = new EventEmitter<void>();
  @Output() speedChange = new EventEmitter<PlaybackSpeed>();

  readonly speeds = PLAYBACK_SPEEDS;

  onSpeed(value: string): void {
    this.speedChange.emit(Number(value) as PlaybackSpeed);
  }
}
