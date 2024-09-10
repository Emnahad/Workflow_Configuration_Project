import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CheckHistoric } from '../../models/checkHistoric';
import { CheckHistoricService } from '../../Service/check-historic.service';

@Component({
  selector: 'app-popup-check-result',
  templateUrl: './popup-check-result.component.html',
  styleUrls: ['./popup-check-result.component.scss']
})
export class PopupCheckResultComponent implements OnInit {
  @Input() checkHistoricListId!: string[];
  historicSuccessResults: any[] = [];
  checkHistoricList: CheckHistoric[] = []; 
  loading: boolean = true;
  canEdit: boolean = false;
  @Output() canEditChange = new EventEmitter<boolean>();
  @Output() closePopup = new EventEmitter<void>();
  constructor(private checkHistoricService: CheckHistoricService) { }

  ngOnInit(): void {
    if (this.checkHistoricListId && this.checkHistoricListId.length > 0) {
      this.getCheckHistorics();
    }
  }

  getCheckHistorics(): void {
    this.checkHistoricList = []; // Clear existing data
    this.loading = true;
    this.historicSuccessResults = [];
    // Fetch data for each ID and update the checkHistoricList
    const requests = this.checkHistoricListId.map(id =>
      this.checkHistoricService.getCheckHistoric(id).toPromise()
    );

    Promise.all(requests)
      .then(results => {
        this.checkHistoricList = results;
        this.extractHistoricSuccessResults();
        this.loading = false;
        
      })
      .catch(error => {
        console.error('Error fetching check historics:', error);
        this.loading = false;
      });
  }
  extractHistoricSuccessResults(): void {
    this.historicSuccessResults = this.checkHistoricList
      .map(checkHistoric => checkHistoric.workflowCheckResult.successResult) 
      .filter(result => result !== undefined && result !== null); 
    console.log(this.historicSuccessResults);
    this.canEdit = !this.historicSuccessResults.some(result => result.trim() === '');


    console.log(this.historicSuccessResults);
    console.log('Can Edit:', this.canEdit);
  }
  onOkClick(): void {
    this.canEditChange.emit(this.canEdit);
    this.closePopup.emit();
  }
  onCancelClick(): void {
    this.closePopup.emit();
  }
}
