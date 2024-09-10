import { Component, ViewChild, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CheckHistoricService } from '../../Service/check-historic.service';
import { ToastrService } from 'ngx-toastr';
import { CheckHistoric } from '../../models/checkHistoric';

@Component({
  selector: 'app-check-results',
  templateUrl: './check-results.component.html',
  styleUrls: ['./check-results.component.scss']
})
export class CheckResultsComponent implements OnInit {
  displayedColumns: string[] = ['id', 'checkName', 'checkDate', 'workflowTitle', 'idResult', 'successResult','errorMessages', 'actions'];
  dataSource = new MatTableDataSource<any>();
  searchText: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private checkHistoricService: CheckHistoricService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.checkHistoricService.getAllCheckHistorics().subscribe(
      (data: CheckHistoric[]) => {
        this.dataSource.data = data.map(item => ({
          id: item.id,
          checkName: item.checkName,
          checkDate: item.checkDate,
          workflowTitle: item.workflowTitle,
          workflowCheckResult: {
            idResult: item.workflowCheckResult.id,
            successResult: item.workflowCheckResult.successResult,
            errorMessages: item.workflowCheckResult.errorMessages,
          },
          isEditing: false 
        }));
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      (error) => {
        console.error('Error fetching collections', error);
      }
    );
  }

  applyFilter(): void {
    const filterValue = this.searchText.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  edit(element: any): void {
    if (element.isEditing) {
      if (!element.workflowCheckResult || !element.workflowCheckResult.idResult) {
        this.toastr.error('WorkflowCheckResult is required.');
        return;
      }

      // Constructing the full CheckHistoric object
      const updatedCheckHistoric: CheckHistoric = {
        id: element.id,
        checkName: element.checkName,
        checkDate: element.checkDate,
        workflowTitle: element.workflowTitle,
        workflowCheckResult: {
          id: element.workflowCheckResult.idResult,
          successResult: element.workflowCheckResult.successResult, 
          errorMessages: element.workflowCheckResult.errorMessages
        }
      };
      console.log("updatedCheckHistoric:",updatedCheckHistoric);
      // Save the changes
      this.checkHistoricService.updateCheckHistoric(updatedCheckHistoric).subscribe(
        () => {
          this.toastr.success('Check historic updated successfully.');
          element.isEditing = false; // Turn off edit mode after saving
        },
        (error) => {
          console.error('Error updating check historic', error);
          this.toastr.error('Failed to update check historic.');
        }
      );
    } else {
      // Enable editing
      element.isEditing = true;
    }
  }




  delete(element: any): void {
    console.log('Delete action triggered for:', element);
    this.checkHistoricService.deleteCheckHistoric(element.id).subscribe(
      () => {
        this.toastr.success('Check historic deleted successfully.');
        this.dataSource.data = this.dataSource.data.filter((item) => item.id !== element.id);
      },
      (error) => {
        console.error('Error deleting check historic', error);
        this.toastr.error('Failed to delete check historic.');
      }
    );
  }
}

