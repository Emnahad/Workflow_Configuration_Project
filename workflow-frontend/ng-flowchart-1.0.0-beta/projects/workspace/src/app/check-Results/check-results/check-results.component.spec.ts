import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckResultsComponent } from './check-results.component';

describe('CheckResultsComponent', () => {
  let component: CheckResultsComponent;
  let fixture: ComponentFixture<CheckResultsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CheckResultsComponent]
    });
    fixture = TestBed.createComponent(CheckResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
