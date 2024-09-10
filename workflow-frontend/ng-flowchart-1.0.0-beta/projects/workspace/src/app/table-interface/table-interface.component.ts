import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { WorkflowService } from '../Service/workflow.service';
import { Workflow, WorkflowNode } from '../models/workflow';
import { DatabaseService } from '../Service/database.service';

import { ToastrService } from 'ngx-toastr';
import { CheckHistoric } from '../models/checkHistoric';
import { SettingsService } from '../Service/settings.service';
import { BSONValue } from 'bson';



@Component({
  selector: 'app-table-interface',
  templateUrl: './table-interface.component.html',
  styleUrls: ['./table-interface.component.scss'],
})
export class TableInterfaceComponent implements OnInit {
  checkHistoricListId: string[] = []; 
  popupCheckResult!: CheckHistoric;
  verifiedWorkflows: string[] = [];
  failedWorkflows: string[] = [];
  sampleJson: any;
  collections: string[] = [];
  selectedCollection: string = '';
  displayedColumns: string[] = [];
  editedColumns: string[] = [];
  dataSource = new MatTableDataSource<any>();
  filteredDataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  previousValues: Map<string, any> = new Map();
  workflows: Workflow[] = [];
  modifiedWorkflows: Map<string, Workflow> = new Map(); 
  showTable: boolean = true;
  showPopup: boolean = false;
  showPopupCheckResult: boolean = false;
  disabled = false;
  searchText: string = '';
  showEmptyState = true;
  editingElement: { element: any, column: string } | null = null;
  canEdit: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private databaseService: DatabaseService,
    private workflowService: WorkflowService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.databaseService.getAllCollections().subscribe(
      (data: string[]) => {
        this.collections = data;
      },
      (error) => {
        console.error('Error fetching collections', error);
      }
    );

    this.fetchWorkflows();
    this.filteredDataSource = this.dataSource;
  }
  fetchWorkflows(): void {
    this.workflowService.getWorkflows().subscribe(
      (data: Workflow[]) => {
        this.workflows = data;
        console.log(this.workflows);
      },
      (error) => {
        console.error('Error fetching workflows', error);
      }
    );
  }

  onRadioChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedCollection = input.value;
  }

  confirmSelection(): void {
    if (this.selectedCollection) {
      this.loadCollectionData(this.selectedCollection);
      this.showPopup = false;
      this.showTable = true;
    } else {
      console.warn('Please select a collection.');
    }
  }

  loadCollectionData(collectionName: string): void {
    this.databaseService.getColumnNamesByCollection(collectionName).subscribe(
      (columns: string[]) => {
        this.displayedColumns = columns;
        this.fetchColumnValues(collectionName, columns);
      },
      (error) => {
        console.error('Error fetching column names', error);
      }
    );
  }

  fetchColumnValues(collectionName: string, columns: string[]): void {
    const columnValues: { [key: string]: any[] } = {};
    let requestsCompleted = 0;

    columns.forEach(column => {
      this.databaseService.getPossibleValuesByTableAndColumn(collectionName, column).subscribe(
        (data: any[]) => {
          columnValues[column] = data;
          requestsCompleted++;
          if (requestsCompleted === columns.length) {
            this.populateTableData(columns, columnValues);
          }
        },
        (error) => {
          console.error(`Error fetching values for column ${column}`, error);
        }
      );
    });
  }

  populateTableData(columns: string[], columnValues: { [key: string]: any[] }): void {
    const tableData = [];
    const numberOfRows = columnValues[columns[0]].length;

    for (let i = 0; i < numberOfRows; i++) {
      const row: any = {};
      columns.forEach(column => {
        row[column] = columnValues[column][i];
      });
      tableData.push(row);
    }

    this.dataSource.data = tableData;
    this.filteredDataSource.data = tableData;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cancelSelection(): void {
    this.selectedCollection = '';
    this.showPopup = false;
    this.showTable = true;
    this.dataSource.data = [];
    this.displayedColumns = [];
    this.searchText = '';
    this.showEmptyState = true; 
  }
  handleEmptyStateButtonClick() {
    console.log('Empty state button clicked');
    this.showPopup = true;
  }

  CheckWorkflow(rowData: any,column:string): void {
    console.log("displayedColumns", this.displayedColumns);
    if (this.displayedColumns.includes(column)) {
      this.editedColumns.push(column);
    }
    console.log("editedColumns", this.editedColumns);
    console.log("Selected column:", column);
    console.log("Selected value:", rowData[column]);
    
    console.log("rowData is:", rowData);
    this.workflowService.extractWorkflowsByTag(this.editedColumns).subscribe(
      (filteredWorkflows: Workflow[]) => {
        
        console.log("filteredWorkflows:", filteredWorkflows);
        filteredWorkflows.forEach(workflow => {
          if (rowData[column] == "BsonNull") {
            rowData[column] = "";
          }
          console.log(rowData[column]);
          this.checkHistoricListId = [];
          this.workflowService.traverseAndUpdate(
            workflow.root,
            rowData,
            workflow,
            [],
            "Final result message"
          ).subscribe(
            (response: any) => {
              console.log('Full API Response:', response);
              if (response && response.result) {
                const result: CheckHistoric = response.result;
                console.log('CheckHistoric:', result);
                this.checkHistoricListId.push(result.id);
                console.log('CheckHistoric IDS:', this.checkHistoricListId);
                this.showPopupCheckResult = true;
              } else {
                console.log('End state not reached or no result returned.');
              }
            },
            (error) => {
              console.error('Error traversing workflow:', error);
            }
          );
          
        });
      },
      (error) => {
        console.error('Error extracting workflows by tag', error);
        alert('Failed to extract workflows. Please check the console for more details.');
      }
    );
  }

  startEditing(element: any, column: string): void {
    console.log("elementis:",element[column])
    this.editingElement = { element, column };
    console.log("editingElement is:", this.editingElement);
    this.previousValues.set(column, element[column]); 
  }




  onEdit(index: number, column: string, newValue: string): void {
    if (this.editingElement) {
      if (this.canEdit) {
        this.editingElement.element[column] = newValue; // Update with the new value, including empty strings
      } else {
        const previousValue = this.previousValues.get(column);
        if (previousValue !== undefined) {
          this.editingElement.element[column] = previousValue;
        }
      }
    }
  }


  onCanEditChange(canEdit: boolean): void {
    this.canEdit = canEdit;

    // If canEdit is false, revert any changes that were made
    if (!canEdit && this.editingElement) {
      const { element, column } = this.editingElement;
      const previousValue = this.previousValues.get(column);
      if (previousValue !== undefined) {
        element[column] = previousValue; // Revert to the previous value
      }
      if (previousValue == "BsonNull") {
        element[column] = previousValue;
      }
      this.editingElement = null; // Clear editing state
    } else if (canEdit && this.editingElement) {
      const { element, column } = this.editingElement;
      const newValue = element[column];
      const oldValue = this.previousValues.get(column);

      // Update the column value in the backend if canEdit is true
      this.databaseService.updateColumnValue(this.selectedCollection, column, oldValue, newValue)
        .subscribe(
          response => {
            this.toastr.success('Column value updated successfully.');
          },
          error => {
            console.error('Error updating column value', error);
            this.toastr.error('Failed to update column value.');
          }
      );
      if (oldValue == "BsonNull") {
        element[column] = oldValue;
      }
    }

    this.editingElement = null; // Clear editing state
  }

  closePopup(): void {
    this.showPopupCheckResult = false;
  }
  

  isEditing(element: any, column: string): boolean {
    return this.editingElement && this.editingElement.element === element && this.editingElement.column === column;
  }
 
  applyFilter(): void {
    const filterValue = this.searchText.trim().toLowerCase();
    this.filteredDataSource.filter = filterValue;

    if (this.filteredDataSource.paginator) {
      this.filteredDataSource.paginator.firstPage();
    }
  }

}
