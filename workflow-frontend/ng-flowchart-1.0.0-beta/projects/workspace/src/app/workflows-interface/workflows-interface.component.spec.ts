import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowsInterfaceComponent } from './workflows-interface.component';

describe('WorkflowsInterfaceComponent', () => {
  let component: WorkflowsInterfaceComponent;
  let fixture: ComponentFixture<WorkflowsInterfaceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkflowsInterfaceComponent]
    });
    fixture = TestBed.createComponent(WorkflowsInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
