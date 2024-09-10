import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SettingsService } from '../../Service/settings.service';
import { NgFlowchartStepComponent } from 'projects/ng-flowchart/src';
import { ToastrService } from 'ngx-toastr';
import { FormDataService } from '../../Service/form-data.service';

@Component({
  selector: 'app-normal-step',
  templateUrl: './normal-step.component.html',
  styleUrls: ['./normal-step.component.scss']
})
export class NormalStepComponent extends NgFlowchartStepComponent implements OnInit {
  showPopupModal = false;
  popupData: any = {};
  showIcon = false;
  nodeId: string;

  activeNode: string | null = null;
  condition: string | null = null;
  constructor(private settingsService: SettingsService, private toastr: ToastrService, private formDataService: FormDataService) {
    super();
  }

  ngOnInit(): void {
    console.log(this.data);
    this.nodeId = this.id;
    this.data = this.data || {};
    this.data.selectedTable = this.data.selectedTable || null;
    this.data.selectedStateCondition = this.data.selectedStateCondition || '';
    this.data.selectedColumnNames = this.data.selectedColumnNames || [];
    this.data.selectedColumnValues = this.data.selectedColumnValues || {};
    this.data.selectedActions = this.data.selectedActions || {};
    this.data.singleColumnChecked = typeof this.data.singleColumnChecked !== 'undefined' ? this.data.singleColumnChecked : true;
    this.data.columnValueModes = this.data.columnValueModes || {};
    this.popupData = {
      title: 'Node Properties',
      selectedTable: this.data.selectedTable || null,
      selectedStateCondition: this.data.selectedStateCondition || '',
      selectedColumnNames: this.data.selectedColumnNames || [],
      selectedActions: this.data.selectedActions || {},
      selectedColumnValues: this.data.selectedColumnValues || {},
      singleColumnChecked: typeof this.data.singleColumnChecked !== 'undefined' ? this.data.singleColumnChecked : true,
      columnValueModes: this.data.columnValueModes || {},
    };
    console.log(this.popupData)
  }

  showPopup(event: MouseEvent) {
    event.stopPropagation();
    this.showPopupModal = true;
    this.popupData.title = 'Node Properties';
    const formDataKey = `step_${this.nodeId}_formData`;
    console.log(formDataKey);
    const savedFormData = this.formDataService.getFormData(formDataKey);
    console.log(savedFormData);
    if (savedFormData) {
      this.data.selectedTable = savedFormData.selectedTable;
      this.data.selectedStateCondition = savedFormData.selectedStateCondition;
      this.data.selectedColumnNames = savedFormData.selectedColumnNames;
      this.data.selectedActions = savedFormData.selectedActions;
      this.data.selectedColumnValues = savedFormData.selectedColumnValues;
      this.data.singleColumnChecked = savedFormData.singleColumnChecked;
      this.data.columnValueModes = savedFormData.columnValueModes;
    }
    // Initialize form fields with saved data
    this.popupData.selectedTable = this.data.selectedTable || null;
    this.popupData.selectedStateCondition = this.data.selectedStateCondition || '';
    this.popupData.selectedColumnNames = this.data.selectedColumnNames || [];
    this.popupData.selectedColumnValues = this.data.selectedColumnValues || {};
    this.popupData.singleColumnChecked = typeof this.data.singleColumnChecked !== 'undefined' ? this.data.singleColumnChecked : true;
    this.popupData.columnValueModes = this.data.columnValueModes || {};
    this.popupData.selectedActions = this.data.selectedActions || {};

    console.log(this.popupData);

    this.settingsService.getAllCollections().subscribe(
      (response: any) => {
        this.popupData.options = response;
      },
      error => {
        console.error('Error fetching table names:', error);
      }
    );
  }

  closePopup() {
    this.showPopupModal = false;
    this.showIcon = false;
  }

  isValidConnectorDropTarget() {
    return true;
  }

  onNodeClick(event: MouseEvent) {
    event.stopPropagation();
    this.showIcon = !this.showIcon;
  }

  handlePopupSubmit(data: any) {

    const stepData = this.data;
    console.log('Step data:', stepData);
    if (!this.data.selectedOperators) {
      this.data.selectedOperators = {};
    }
    if (!this.data.selectedColumnValues) {
      this.data.selectedColumnValues = {};
    }

    if (data.selectedStateCondition === "End State") {
      this.data.selectedTable = null;
      this.data.selectedColumnNames = [];
      this.data.selectedColumnValues = {};
      this.data.singleColumnChecked = true;
      this.data.columnValueModes = {};
      console.log("endState",data.endState);
      this.data.inputs[0].description = data.endState;
      this.data.inputs[0].actions[0].values = [];
      this.data.inputs[0].actions[0].newValues = {};
      this.data.name = data.selectedStateCondition;
    } else if (Array.isArray(data.selectedColumns)) {
      let i = 0;
      let j = 0;
      data.selectedColumns.forEach(column => {
        if (!stepData.inputs[j]) {
          stepData.inputs[j] = {
            tableName: '',
            columnName: '',
            actions: [],
            description: ''
          };
        }
        this.data.selectedColumnValues[column.name] = column.value;
        this.data.selectedTable = column.table;
        this.data.singleColumnChecked = column.checkType;
        this.data.selectedActions = column.actions;
        this.data.selectedStateCondition = column.type;
        console.log(column.columnType[column.name]);
        console.log(column.actions[column.name]);
        console.log(column.actions[column.name].length);
        stepData.inputs[j].tableName = column.table;
        stepData.inputs[j].columnName = column.name;
        
        column.actions[column.name].forEach((action, i) => { 
          console.log("action:",action)
          console.log("i", i);
          if (!stepData.inputs[j].actions) {
            stepData.inputs[j].actions = [];
          }

          // Initialize the specific action object if it's undefined
          if (!stepData.inputs[j].actions[i]) {
            stepData.inputs[j].actions[i] = {
              CrudCommandAction: {},
            };
          }
          stepData.inputs[j].actions[i].CrudCommandAction.crud = action;
          stepData.inputs[j].actions[i].CrudCommandAction.condition = column.condition[action]?.toString();
          stepData.inputs[j].actions[i].values = column.value[action];
          stepData.inputs[j].actions[i].newValues = column.newValue;

          console.log("stepData", stepData);

          if (action === 'Read') {
            if (column.condition[action]?.includes('contains')) {
              stepData.inputs[i].description = `ReadValue: ${column.name} from ${column.table} contains(${column.value[action].join(', ')})`;
            } else if (column.condition[action]?.includes('not contains')) {
              stepData.inputs[i].description = `ReadValue: ${column.name} from ${column.table} not contains(${column.value[action].join(', ')})`;
            } else if (column.condition[action]?.includes('uppercase')) {
              stepData.inputs[i].description = `${column.name} from ${column.table} uppercase(${column.value[action]})`;
            } else if (column.condition[action]?.includes('max')) {
              stepData.inputs[i].description = `max( ${column.value[action].join(', ')}) from ${column.name} from ${column.table} `;
            } else if (column.condition[action]?.includes('min')) {
              stepData.inputs[i].description = `min( ${column.value[action].join(', ')}) from ${column.name} from ${column.table}`;
            } else if (column.condition[action]?.includes('average')) {
              stepData.inputs[i].description = `average( ${column.value[action].join(', ')}) from ${column.name} from ${column.table}`;
            } else if (column.condition[action]?.includes('>')) {
              stepData.inputs[i].description = `ReadValue: ${column.name}> ${column.value[action]} from ${column.table}`;
            } else if (column.condition[action]?.includes('<')) {
              stepData.inputs[i].description = `ReadValue: ${column.name}< ${column.value[action]} from ${column.table}`;
            } else {
              stepData.inputs[i].description = `ReadValue: ${column.name}=${column.value[action]} from ${column.table}`;
            }
          }

          if (action === 'Set' && stepData.inputs[j].actions[i].CrudCommandAction.condition ==undefined) {
            if (column.value[action].length === 1) {
              stepData.inputs[j].description += ` SetValue: ${column.value[action]} From ${column.name} which is from ${column.table} Set to ${column.newValue[column.value[action]]}`;
            } else {
              const newValueList = column.value[action].map(val => column.newValue[val]).join(', ');
              stepData.inputs[j].description += ` SetValue: ${column.value[action]} From ${column.name} which is from ${column.table} Set to ${newValueList}`;
            }
          }

          if (action === 'Delete' && stepData.inputs[j].actions[i].CrudCommandAction.condition == undefined) {
            stepData.inputs[i].description = ` DeleteValue: ${column.value[action]} Is Deleted from ${column.name} from ${column.table}`;
          }

       
        });
       
        j++;
        i = 0;
        console.log("i:", i, "j:", j);
      });
      stepData.name = this.data.selectedStateCondition;
      this.data.selectedColumnNames = data.selectedColumns.map(column => column.name);

      this.data.selectedColumnValues = data.selectedColumns.reduce((acc, column) => {
        acc[column.name] = column.value;
        return acc;
      }, {});
      console.log('Submitted Data is :', stepData);
    }
    const formDataKey = `step_${this.nodeId}_formData`;
    console.log(formDataKey);
    const formData = {
      selectedTable: this.data.selectedTable,
      selectedStateCondition: this.data.selectedStateCondition,
      selectedColumnNames: this.data.selectedColumnNames,
      selectedActions: this.data.selectedActions,
      selectedColumnValues: this.data.selectedColumnValues,
      singleColumnChecked: this.data.singleColumnChecked,
      columnValueModes: this.data.columnValueModes,
    };
    console.log(formData);
    this.formDataService.setFormData(formDataKey, formData);
    this.showPopupModal = false;
  }

  deleteNode(event: MouseEvent) {
    event.stopPropagation();
    this.destroy();
    this.toastr.warning('Warning', 'Node deleted');
  }
}
