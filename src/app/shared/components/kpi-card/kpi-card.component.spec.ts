import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KpiCardComponent);
    fixture.componentRef.setInput('label', 'Active flights');
    fixture.componentRef.setInput('value', 12);
    fixture.componentRef.setInput('tone', 'active');
    fixture.detectChanges();
  });

  it('shows value and label', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.value')?.textContent).toContain('12');
    expect(el.querySelector('.label')?.textContent).toContain('Active flights');
    expect(el.querySelector('[data-tone="active"]')).toBeTruthy();
  });
});
