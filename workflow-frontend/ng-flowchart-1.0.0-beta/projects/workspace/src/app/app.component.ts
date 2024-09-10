import {
  AfterViewInit,
  Component,
  TemplateRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import {
  NgFlowchart,
  NgFlowchartCanvasDirective,
  NgFlowchartStepRegistry,
  NgFlowchartStepComponent,
} from 'projects/ng-flowchart/src';
import { CustomStepComponent } from './custom-step/custom-step.component';
import { RouteStepComponent } from './custom-step/route-step/route-step.component';
import { DecisionStepComponent } from './custom-step/decision-step/decision-step.component';
import { FormStepComponent } from './form-step/form-step.component';
import { NestedFlowComponent } from './nested-flow/nested-flow/nested-flow.component';
import { PopupComponent } from './Popup/popup/popup.component';
import { NormalStepComponent } from './normal-step/normal-step/normal-step.component';
import { WorkflowService } from './Service/workflow.service';
import { SettingsService } from './Service/settings.service';
import { ToastrService } from 'ngx-toastr';
interface MyCallbacks extends NgFlowchart.Callbacks {
  onDrop?: (event: NgFlowchart.DropEvent) => void;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {

  @ViewChild('popupComponent') popupComponent: PopupComponent;
  @ViewChild('canvasContent', { static: true })
  canvasContent: NgFlowchartCanvasDirective;
  @ViewChild(NgFlowchartCanvasDirective)
  canvas: NgFlowchartCanvasDirective;
  title = 'workspace';
  nodeId: string | null = null;
  currentWorkflowId: string | null = null; 
  currentView: string = 'workflows';
  showPopupModal = false;
  popupData: any = {};
  activeNode: string | null = null;
  callbacks: MyCallbacks = {};
  condition: string | null = null; 
  workflows: any[] = [];
  sampleJson: any;
  selectedWorkflowId: string | null = null;
  private activeDropdown: number | null = null;
  showSaveWorkflowPopup = false;
  workflowTitle = '';
  autosaveInterval: any;
  editingWorkflowId: string | null = null; 
  editingWorkflowTitle: string = '';
  dataCurrentArray: Array<any> = [];
  dataRedoArray: Array<any> = [];
  undoLimit: number = 9;
  showUndo: boolean = false;
  showRedo: boolean = false;
  searchTerm: string = '';
  savedFormData: any;
  options: NgFlowchart.Options = {
    stepGap: 80,
    rootPosition: 'TOP_CENTER',
    zoom: {
      mode: 'WHEEL',
      skipRender: true,
    },
    dragScroll: ['RIGHT', 'MIDDLE'],
    orientation: 'VERTICAL',
    manualConnectors: true,
  };

  customOps = [
    {
      paletteName: 'Logger Node',
      step: {
        template: NormalStepComponent,
        name: 'State',
        type: 'log',
        data: {
          name: 'State',
          typelog: 'Normal Node',
          selectedTable: '', 
          selectedColumnNames: [], 
          selectedOperators: {}, 
          selectedColumnValues: {}, 
          singleColumnChecked: false, 
          columnValueModes:{},
        },
      }
    },
    {
      paletteName: 'Decision Node',
      step: {
        template: DecisionStepComponent,
        type: 'Decision-step',
        data: {
          name: 'Decision',
          typelog: 'Decision-Node',
          selectedTable: '',
          selectedColumnNames: [],
          selectedOperators: {}, 
          selectedColumnValues: {}, 
          singleColumnChecked: false, 
          columnValueModes:{},
        },
      },
    },
  ];



  disabled = false;

  constructor(
    private stepRegistry: NgFlowchartStepRegistry,
    private settingsService: SettingsService,
    private workflowService: WorkflowService,
    private cd: ChangeDetectorRef,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
  ) {
    this.callbacks = {
      onDropError: this.onDropError,
      onMoveError: this.onMoveError,
      afterDeleteStep: this.afterDeleteStep,
      beforeDeleteStep: this.beforeDeleteStep,
      onLinkConnector: this.onLinkConnector,
      afterDeleteConnector: this.afterDeleteConnector,
      afterScale: this.afterScale.bind(this),
      
    };
  }
  ngOnInit(): void {
    
  }
  ngOnDestroy(): void {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
  }

  ngAfterViewInit() {
    this.stepRegistry.registerStep('log', NormalStepComponent);
    this.stepRegistry.registerStep('router', CustomStepComponent);
    this.stepRegistry.registerStep('nested-flow', NestedFlowComponent);
    this.stepRegistry.registerStep('form-step', FormStepComponent);
    this.stepRegistry.registerStep('route-step', RouteStepComponent);
    this.stepRegistry.registerStep('Decision-step', DecisionStepComponent); 
    
   
   
    if (this.canvasContent) {
      console.log('canvasContent is available:', this.canvasContent);
      
    } else {
      console.error('canvasContent is not available.');
    }

  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Close dropdown if click is outside the dropdown area
    if (!target.closest('.dropdown') && this.activeDropdown !== null) {
      this.activeDropdown = null;
    }
  }

  

  onDropError(error: NgFlowchart.DropError) {
    console.log(error);
  }

  onMoveError(error: NgFlowchart.MoveError) {
    console.log(error);
  }

  beforeDeleteStep(step) {
    console.log(JSON.stringify(step.children));
  }

  afterDeleteStep(step) {
    console.log(JSON.stringify(step.children));
  }

  onLinkConnector(conn) {
    console.log(conn);
  }

  afterDeleteConnector(conn) {
    console.log(conn);
  }

  afterScale(scale: number): void {
    const firstSetOfChildren = this.canvas.getFlow().getRoot().children;
    firstSetOfChildren.forEach((step) => {
      if (step instanceof NestedFlowComponent) {
        step.nestedCanvas.setNestedScale(scale);
      }
    });
  }

  showFlowData() {
    let json = this.canvas.getFlow().toJSON(4);
    var x = window.open();
    x.document.open();
    x.document.write(
      '<html><head><title>Flowchart Json</title></head><body><pre>' +
      json +
      '</pre></body></html>'
    );
    x.document.close();
  }


  clearData() {
    this.canvas.getFlow().clear();
  }

  onGapChanged(event) {
    this.options = {
      ...this.canvas.options,
      stepGap: parseInt(event.target.value),
    };
  }

  onSequentialChange(event) {
    this.options = {
      ...this.canvas.options,
      isSequential: event.target.checked,
    };
  }

  onOrientationChange(event) {
    this.canvas.setOrientation(event.target.checked ? 'HORIZONTAL' : 'VERTICAL');
  }

  onDelete(id) {
    this.canvas.getFlow().getStep(id).destroy(true);
  }

  onGrow() {
    this.canvas.scaleUp();
  }

  onShrink() {
    this.canvas.scaleDown();
  }

  onReset() {
    this.canvas.setScale(1);
  }
  onViewChange(view: string): void {
    this.currentView = view;
  }
 
}
