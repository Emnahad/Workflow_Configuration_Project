import { Component, Input, OnInit } from '@angular/core';
import { NgFlowchartStepComponent } from 'projects/ng-flowchart/src';
import { NgFlowchart } from 'projects/ng-flowchart/src';
import { SettingsService } from '../../Service/settings.service';
import { ToastrService } from 'ngx-toastr';
import { FormDataService } from '../../Service/form-data.service';

@Component({
  selector: 'app-decision-step',
  templateUrl: './decision-step.component.html',
  styleUrls: ['./decision-step.component.scss']
})
export class DecisionStepComponent extends NgFlowchartStepComponent implements OnInit {
  @Input() data: any;
  showPopupModal = false;
  popupData: any = {};
  showIcon = false;
  nodeId: string;

  constructor(private settingsService: SettingsService, private toastr: ToastrService, private formDataService: FormDataService) {
    super();
  }

  ngOnInit(): void {
    console.log(this.data);
    this.nodeId = this.id;
    this.data = this.data || {};
    this.data.selectedTable = this.data.selectedTable || null;
    this.data.selectedStateCondition = this.data.typelog || '';
    this.data.selectedColumnNames = this.data.selectedColumnNames || [];
    this.data.selectedOperators = this.data.selectedOperators || {};
    this.data.selectedColumnValues = this.data.selectedColumnValues || {};
    this.data.singleColumnChecked = typeof this.data.singleColumnChecked !== 'undefined' ? this.data.singleColumnChecked : true;
    this.data.columnValueModes = this.data.columnValueModes || {};
    // Initialize popupData with this.data
    this.popupData = {
      title: 'Node Properties',
      selectedTable: this.data.selectedTable || null,
      selectedStateCondition: this.data.typelog || '',
      selectedColumnNames: this.data.selectedColumnNames || [],
      selectedOperators: this.data.selectedOperators || {},
      selectedColumnValues: this.data.selectedColumnValues || {},
      singleColumnChecked: typeof this.data.singleColumnChecked !== 'undefined' ? this.data.singleColumnChecked : true,
      columnValueModes: this.data.columnValueModes || {},

    };
    console.log(this.popupData)
  }

  onNodeClick(event: MouseEvent) {
    event.stopPropagation();
    this.showIcon = !this.showIcon;
  }

  showPopup(event: MouseEvent) {
    event.stopPropagation();
    this.showPopupModal = true;
    this.popupData.title = 'Decision-Node Properties';
    const formDataKey = `step_${this.nodeId}_formData`;
    console.log(formDataKey);
    if (this.nodeId != undefined) {
      const savedFormData = this.formDataService.getFormData(formDataKey);
      console.log(savedFormData);
      if (savedFormData) {
        this.data.selectedTable = savedFormData.selectedTable;
        this.data.selectedOperators = savedFormData.selectedOperators;
        this.data.selectedStateCondition = savedFormData.selectedStateCondition;
        this.data.selectedColumnNames = savedFormData.selectedColumnNames;
        this.data.selectedActions = savedFormData.selectedActions;
        this.data.selectedColumnValues = savedFormData.selectedColumnValues;
        this.data.singleColumnChecked = savedFormData.singleColumnChecked;
        this.data.columnValueModes = savedFormData.columnValueModes;
      }
    }

    // Initialize form fields with saved data
    this.popupData.selectedTable = this.data.selectedTable || null;
    this.popupData.selectedStateCondition = this.data.typelog || '';
    this.popupData.selectedColumnNames = this.data.selectedColumnNames || [];
    this.popupData.selectedOperators = this.data.selectedOperators || {};
    this.popupData.selectedColumnValues = this.data.selectedColumnValues || {};
    this.popupData.singleColumnChecked = typeof this.data.singleColumnChecked !== 'undefined' ? this.data.singleColumnChecked : true;
    this.popupData.columnValueModes = this.data.columnValueModes || {};
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

  getDropPositionsForStep(step: NgFlowchart.Step | NgFlowchart.Connector): NgFlowchart.DropPosition[] {
    return ['BELOW', 'LEFT', 'RIGHT', 'ABOVE'];
  }

  isValidConnectorDropTarget() {
    return true;
  }

  handlePopupSubmit(data: any) {
    const stepData = this.data;
    console.log('Step data:', stepData);

    if (!this.data.selectedOperators) {
      this.data.selectedOperators = {};
    }
    if (!this.data.selectedDecisionValues) {
      this.data.selectedDecisionValues = {};
    }

    if (Array.isArray(data.selectedColumns)) {
      data.selectedColumns.forEach((column, i) => {
        this.data.selectedOperators[column.name] = column.operator;
        this.data.selectedDecisionValues[column.name] = column.decisionValues;
        this.data.selectedTable = column.table;
        this.data.singleColumnChecked = column.checkType;

        if (!this.data.inputs[i]) {
          this.data.inputs[i] = { tableName: '', columnName: '', actions: [{}], description: '' };
        }
        this.data.inputs[i].actions[0].newValues = {};
        this.data.inputs[i].description = '';
        this.data.inputs[i].tableName = column.table;
        this.data.inputs[i].columnName = column.name;
        this.data.inputs[i].actions[0].operatorDecision = column.operator;
        this.data.inputs[i].actions[0].values = column.decisionValues[column.name];
        const columnValue = column.decisionValues[column.name];

        let descriptionPart = '';

        if (column.operator === 'NotEmpty' || column.operator === 'IsEmpty') {
          descriptionPart = `${column.name} ${column.operator}`;
        } else {
          descriptionPart = `${column.name} ${column.operator} ${columnValue !== undefined ? columnValue : ''}`;
        }
        console.log(this.data.inputs[i].description);
        if (this.data.inputs[i].description) {
          this.data.inputs[i].description += ` and ${descriptionPart}`;
        } else {
          this.data.inputs[i].description = descriptionPart;
        }
        console.log(this.data.inputs[i].description);



      });
      this.data.selectedStateCondition = data.selectedStateCondition;
      this.data.selectedColumnNames = data.selectedColumns.map(column => column.name);

      this.data.selectedOperators = data.selectedColumns.reduce((acc, column) => {
        acc[column.name] = column.operator;
        return acc;
      }, {});
      this.data.selectedColumnValues = data.selectedColumns.reduce((acc, column) => {
        acc[column.name] = column.value;
        return acc;
      }, {});

      const updatedType = data.selectedColumns.length > 0 ? data.selectedColumns[0].type : '';



      stepData.typelog = updatedType;

    } else {
      stepData.name = data.name;
      stepData.typelog = data.selectedStateCondition;
    }
    const formDataKey = `step_${this.nodeId}_formData`;
    console.log(formDataKey);
    if (this.nodeId != undefined) {
      const formData = {
        selectedTable: this.data.selectedTable,
        selectedStateCondition: this.data.selectedStateCondition,
        selectedColumnNames: this.data.selectedColumnNames,
        selectedOperators: this.data.selectedOperators,
        selectedActions: this.data.selectedActions,
        selectedColumnValues: this.data.selectedColumnValues,
        singleColumnChecked: this.data.singleColumnChecked,
        columnValueModes: this.data.columnValueModes,
      };
      console.log(formData);
      this.formDataService.setFormData(formDataKey, formData);
    }

    this.showPopupModal = false;
  }
  deleteNode(event: MouseEvent) {
    event.stopPropagation();
    this.destroy();
    this.toastr.warning('Warning', 'Decision-Node deleted')
  }

}
