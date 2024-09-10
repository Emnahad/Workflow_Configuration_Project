import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalStepComponent } from './normal-step.component';

describe('NormalStepComponent', () => {
  let component: NormalStepComponent;
  let fixture: ComponentFixture<NormalStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NormalStepComponent]
    });
    fixture = TestBed.createComponent(NormalStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
