import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  it('renders the status text (not colour alone)', () => {
    fixture.componentRef.setInput('status', 'Delayed');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Delayed');
    expect(fixture.nativeElement.querySelector('[data-status="Delayed"]')).toBeTruthy();
  });
});
