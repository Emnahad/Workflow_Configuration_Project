import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SettingsService } from '../../Service/settings.service';
import { ToastrService } from 'ngx-toastr';
import { MatSelectChange } from '@angular/material/select';
import { FormDataService } from '../../Service/form-data.service';
@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit, OnChanges {
  @Input() title: string = '';
  @Input() options: string[] = [];
  @Input() nodeType: string = '';
  @Input() selectedTable: string | null = null;
  @Input() selectedStateCondition: string = '';
  @Input() selectedColumnNames: string[] = [];
  @Input() selectedOperators: { [key: string]: string } = {} || undefined;
  @Input() selectedColumnValues: { [key: string]: { [key: string]: string[] } } = {};
  @Input() singleColumnChecked: boolean = true;
  @Input() columnValueModes: { [column: string]: { [action: string]: boolean } } = {};
  @Input() selectedActions: { [key: string]: string[] } = {};
  @Input() DecisionValueModes: { [key: string]: boolean } = {};
  @Input() selectedDecisionValues: { [key: string]: string | string[] } = { };
  @Input() selectedCommandActions: { [key: string]: string[] } = {};
  @Input() nodeId: string;

  @Input() endState: string;
  @Output() onSubmit: EventEmitter<any> = new EventEmitter<any>();
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  newValue: { [key: string]: string } = {};
  CrudActions: string[] = ['Read', 'Set', 'Delete'];
  CommandActionsForInt: string[] = ['max', 'min', 'average', '<', '>', '<=', '>=', '!='];
  CommandActionsForStr: string[] = ['contains', 'not contains', 'uppercase'];
  selectedAction: string = 'Read';
  selectedTableColumns: { name: string; type: string; }[] = [];
  ValuesSelectedColumn: { [key: string]: string[] } = {};
  stringAndBoolOperators: string[] = ['=', '!=', 'IsEmpty', 'NotEmpty', 'In', 'NotIn'];
  intOperators: string[] = ['=', '!=', '>', '>=', '<', '<='];
  popupVisible = true;
  
  columnDictionary: { [key: string]: string } = {};
  constructor(private settingsService: SettingsService, private toastr: ToastrService, private formDataService: FormDataService,) { }

  ngOnInit(): void {
    console.log('PopupComponent - ngOnInit - Inputs:', {
      title: this.title,
      options: this.options,
      nodeType: this.nodeType,
      selectedTable: this.selectedTable,
      selectedActions: this.selectedActions,
      selectedStateCondition: this.selectedStateCondition,
      selectedColumnNames: this.selectedColumnNames,
      selectedOperators: this.selectedOperators,
      selectedColumnValues: this.selectedColumnValues,
      singleColumnChecked: this.singleColumnChecked,
      columnValueModes: this.columnValueModes,
      nodeId: this.nodeId,
      selectedCommandActions: this.selectedCommandActions,
      DecisionValueModes: this.DecisionValueModes,
      selectedDecisionValues: this.selectedDecisionValues,
      endState:this.endState,
    });
    this.initializeFields();
   
    const formDataKey = `step_${this.nodeId}_formData`;
    console.log('FormData Key:', formDataKey);
    if (this.nodeId != undefined) {
      const savedFormData = this.formDataService.getFormData(formDataKey);
      if (savedFormData) {
        console.log('Retrieved Form Data:', savedFormData);
        this.populateFormWithSavedData(savedFormData);
      } else {
        console.log('No saved form data found for ID:', this.nodeId);
      }
    }

    
  }

  populateFormWithSavedData(savedFormData: any): void {
    this.selectedTable = savedFormData.selectedTable;
    this.selectedStateCondition = savedFormData.selectedStateCondition;
    this.selectedColumnNames = savedFormData.selectedColumnNames;
    this.selectedActions = savedFormData.selectedActions;
    this.selectedColumnValues = savedFormData.selectedColumnValues;
    this.singleColumnChecked = savedFormData.singleColumnChecked;
    this.columnValueModes = savedFormData.columnValueModes;
    this.selectedCommandActions = savedFormData.selectedCommandActions;
    this.selectedDecisionValues = savedFormData.selectedDecisionValues;
    this.DecisionValueModes = savedFormData.DecisionValueModes;
    this.endState = savedFormData.endState;
    
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedTable && !changes.selectedTable.firstChange) {
      this.onTableSelect();
    }

    if (changes.selectedColumnNames && !changes.selectedColumnNames.firstChange) {
      this.initializeFields();
    }

  }

  initializeFields(): void {
    if (this.selectedTable) {
      this.onTableSelect();
      this.selectedColumnNames.forEach(column => {
        this.onColumnSelect({ target: { value: column } } as any);
      });
    }
    console.log('Initialized fields:', {
      selectedTable: this.selectedTable,
      selectedColumnNames: this.selectedColumnNames,
      selectedOperators: this.selectedOperators,
      selectedColumnValues: this.selectedColumnValues,
      checkType: this.singleColumnChecked,
      columnValueModes: this.columnValueModes,
      columnDictionary: this.columnDictionary,
      selectedActions: this.selectedActions,
      selectedCommandActions: this.selectedCommandActions,
      selectedDecisionValues: this.selectedDecisionValues,
      DecisionValueModes: this.DecisionValueModes,
      endState: this.endState,

    });
  }

  onTableSelect() {
    if (this.selectedTable) {
      this.settingsService.getColumnNamesAndTypesByCollection(this.selectedTable).subscribe(
        (columns: { [key: string]: string }) => {
          this.selectedTableColumns = Object.keys(columns).map(key => ({
            name: key,
            type: columns[key]
          }));
          this.columnDictionary = columns;

          console.log('Column Dictionary:', this.columnDictionary);
        },
        error => {
          console.error('Error fetching columns:', error);
          this.selectedTableColumns = [];
        }
      );
    } else {
      this.selectedTableColumns = [];
    }
  }

  onValueSelect(event: Event, columnName: string, action: string): void {
    const value = (event.target as HTMLSelectElement).value;
    const isChecked = (event.target as HTMLInputElement).checked;

    console.log("Value selected:", value);
    console.log("Column:", columnName);
    console.log("Action:", action);
    console.log("ColumnValueModes:", this.columnValueModes);
    console.log("SelectedColumnValues:", this.selectedColumnValues);

    // Initialize column and action if not already done
    if (!this.selectedColumnValues[columnName]) {
      this.selectedColumnValues[columnName] = {};
    }
    if (!this.selectedColumnValues[columnName][action]) {
      this.selectedColumnValues[columnName][action] = [];
    }

    if (this.columnValueModes[columnName]?.[action]) {
      // Single value mode
      this.selectedColumnValues[columnName][action] = [value];
    } else {
      // Multiple values mode
      const selectedValues = this.selectedColumnValues[columnName][action] as string[];
      if (isChecked) {
        if (!selectedValues.includes(value)) {
          selectedValues.push(value);
        }
      } else {
        const index = selectedValues.indexOf(value);
        if (index !== -1) {
          selectedValues.splice(index, 1);
        }
      }
    }

    console.log("Updated SelectedColumnValues:", this.selectedColumnValues);

    
  }


  onColumnSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newlySelectedColumn = target.value;

    if (this.singleColumnChecked) {
      this.selectedColumnNames = [newlySelectedColumn];
    } else {
      this.selectedColumnNames.push(newlySelectedColumn);
      this.selectedColumnNames = Array.from(new Set(this.selectedColumnNames));
    }
   
    Object.keys(this.selectedActions).forEach(column => {
      if (!this.selectedColumnNames.includes(column)) {
        delete this.selectedActions[column];
      }
    });
    if (this.selectedTable && newlySelectedColumn) {
      this.settingsService.getPossibleValuesByTableAndColumn(this.selectedTable, newlySelectedColumn).subscribe(
        (values: string[]) => {
          this.ValuesSelectedColumn[newlySelectedColumn] = values;
          this.columnValueModes[newlySelectedColumn] = this.columnValueModes[newlySelectedColumn] ?? {};

        },
        error => {
          console.error(`Error fetching values for column ${newlySelectedColumn}:`, error);
        }
      );
    }
  }


  getOperators(): string[] {
    const columnTypes = this.selectedColumnNames.map(columnName =>
      this.selectedTableColumns.find(column => column.name === columnName)?.type
    );

    if (columnTypes.every(type => type === 'String' || type === 'Boolean')) {
      return this.stringAndBoolOperators;
    } else if (columnTypes.every(type => type === 'Int32' || type === 'Int')) {
      return this.intOperators;
    }
    return [];
  }

  getColumnValues(columnName: string): string[] {
    return this.ValuesSelectedColumn[columnName] || [];
  }

  submitForm(): void {
    if (this.selectedStateCondition !== 'End State') {
      const selectedColumns = [];
      this.selectedColumnNames.forEach(column => {

        selectedColumns.push({
          decisonModes: this.DecisionValueModes,
          decisionValues:this.selectedDecisionValues,
          newValue: this.newValue,
          actions: this.selectedActions,
          checkType: this.singleColumnChecked,
          columnType: this.columnDictionary,
          name: column,
          operator: this.selectedOperators[column],
          value: this.selectedColumnValues[column],
          type: this.selectedStateCondition,
          condition:this.selectedCommandActions
          
        });
        
      });
      
      const formData = {
        selectedColumns: selectedColumns.map(column => ({
          decisonModes: column.decisonModes,
          decisionValues: column.decisionValues,
          condition:column.condition,
          newValue: column.newValue,
          columnType: column.columnType,
          actions: column.actions,
          checkType: this.singleColumnChecked,
          table: this.selectedTable,
          operator: column.operator,
          name: column.name,
          value: column.value,
          type: column.type,
        }))
      };
      console.log("formData is:", formData);
      if (formData && Object.keys(formData).length > 0) {
        this.onSubmit.emit(formData);
      } else {
        console.error('Form data is undefined or empty');
      }

    } else {
      const formData = {
        endState: this.endState,
        selectedStateCondition: this.selectedStateCondition
      };
      console.log(formData);
      this.onSubmit.emit(formData);

    }

    this.close.emit();
    this.toastr.success('Information Node Saved', 'Success');
  }

  closePopup() {
    this.popupVisible = false;
    this.close.emit();
  }

  trackByFn(index: number, item: any): number {
    return index;
  }
  

  onCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedColumnNames.push(input.value);

    } else {
      this.selectedColumnNames = this.selectedColumnNames.filter(column => column !== input.value);
      delete this.selectedActions[input.value];
    }
    this.selectedColumnNames = Array.from(new Set(this.selectedColumnNames));

    if (this.selectedTable && input.value) {
      this.settingsService.getPossibleValuesByTableAndColumn(this.selectedTable, input.value).subscribe(
        (values: string[]) => {
          this.ValuesSelectedColumn[input.value] = values;
          this.columnValueModes[input.value] = this.columnValueModes[input.value] || {};
          this.DecisionValueModes[input.value] = this.DecisionValueModes[input.value] || true;



        },
        error => {
          console.error(`Error fetching values for column ${input.value}:`, error);
        }
      );
    }
    console.log('Selected columns:', this.selectedColumnNames);
  }

  isColumnSelected(columnName: string): boolean {
    return this.selectedColumnNames.includes(columnName);
  }
  isValueSelected(columnName: string, value: string,action:string): boolean {
    return this.selectedColumnValues[columnName]?.[action].includes(value) || false;
  }

  getColumnType(columnName: string): string {
    const column = this.selectedTableColumns.find(col => col.name === columnName);
    return column ? column.type : '';
  }

  onActionChecked(event: Event, column: string): void {
    const target = event.target as HTMLInputElement;
    const action = target.value;

    if (target.checked) {
      // Initialize the array if it doesn't exist
      if (!this.selectedActions[column]) {
        this.selectedActions[column] = [];
      }
      // Add the action if it's not already selected
      if (!this.selectedActions[column].includes(action)) {
        this.selectedActions[column].push(action);
        console.log("selectedAction", this.selectedActions);
      }
    } else {
      // Remove the action if it's unselected
      const index = this.selectedActions[column]?.indexOf(action);
      if (index !== undefined && index !== -1) {
        this.selectedActions[column].splice(index, 1);
        console.log("selectedAction after removal", this.selectedActions);
      }
    }
  }


  isSelected(column: string, action: string): boolean {
    return this.selectedActions[column]?.includes(action) || false;
  }
  onCommandActionChecked(event: Event, action: string): void{
    const target = event.target as HTMLInputElement;
    const commandAction = target.value;
    if (target.checked) {
      // Initialize the array if it doesn't exist
      if (!this.selectedCommandActions[action]) {
        this.selectedCommandActions[action] = [];
      }
      // Add the action if it's not already selected
      if (!this.selectedCommandActions[action].includes(commandAction)) {
        this.selectedCommandActions[action].push(commandAction);
        console.log("selectedCommandActions", this.selectedCommandActions);
      }
    } else {
      // Remove the action if it's unselected
      const index = this.selectedCommandActions[action]?.indexOf(commandAction);
      if (index !== undefined && index !== -1) {
        this.selectedCommandActions[action].splice(index, 1);
        console.log("selectedCommandActions after removal", this.selectedCommandActions);
      }
    }
    
  }
  itsSelected(column: string, commandAction: string): boolean{
    return this.selectedCommandActions[column]?.includes(commandAction) || false;
  
  }

  onValueDecisionSelect(event: Event, columnName: string): void {
    const value = (event.target as HTMLInputElement).value;
    const isChecked = (event.target as HTMLInputElement).checked;

    if (this.DecisionValueModes[columnName]) {
      // Single value mode
      this.selectedDecisionValues[columnName] = [value];
    } else {
      // Multiple values mode
      if (!this.selectedDecisionValues[columnName]) {
        this.selectedDecisionValues[columnName] = [];
      }
      const selectedValues = this.selectedDecisionValues[columnName] as string[];
      if (isChecked) {
        selectedValues.push(value);
      } else {
        const index = selectedValues.indexOf(value);
        if (index !== -1) {
          selectedValues.splice(index, 1);
        }
      }
      this.selectedDecisionValues[columnName] = selectedValues;
    }
  }
  isValueDecisionSelected(columnName: string, value: string): boolean {
    return this.selectedDecisionValues[columnName]?.includes(value) || false;
  }

}
