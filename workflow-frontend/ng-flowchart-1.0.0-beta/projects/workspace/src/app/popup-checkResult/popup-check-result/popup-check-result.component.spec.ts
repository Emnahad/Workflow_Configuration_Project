import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupCheckResultComponent } from './popup-check-result.component';

describe('PopupCheckResultComponent', () => {
  let component: PopupCheckResultComponent;
  let fixture: ComponentFixture<PopupCheckResultComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PopupCheckResultComponent]
    });
    fixture = TestBed.createComponent(PopupCheckResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
