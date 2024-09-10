import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NestedFlowComponent } from './nested-flow.component';

describe('NestedFlowComponent', () => {
  let component: NestedFlowComponent;
  let fixture: ComponentFixture<NestedFlowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NestedFlowComponent]
    });
    fixture = TestBed.createComponent(NestedFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
