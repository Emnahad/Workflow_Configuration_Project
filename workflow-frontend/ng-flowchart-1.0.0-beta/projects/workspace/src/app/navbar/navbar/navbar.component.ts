import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Output() viewChange = new EventEmitter<string>();

  setView(view: string): void {
    this.viewChange.emit(view);
  }
}
