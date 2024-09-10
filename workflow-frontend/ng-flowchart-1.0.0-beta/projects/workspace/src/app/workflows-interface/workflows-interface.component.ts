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
import { CustomStepComponent } from '../custom-step/custom-step.component';
import { RouteStepComponent } from '../custom-step/route-step/route-step.component';
import { DecisionStepComponent } from '../custom-step/decision-step/decision-step.component';
import { FormStepComponent } from '../form-step/form-step.component';
import { NestedFlowComponent } from '../nested-flow/nested-flow/nested-flow.component';
import { PopupComponent } from '../Popup/popup/popup.component';
import { NormalStepComponent } from '../normal-step/normal-step/normal-step.component';
import { WorkflowService } from '../Service/workflow.service';
import { SettingsService } from '../Service/settings.service';
import { ToastrService } from 'ngx-toastr';
import { FormDataService } from '../Service/form-data.service';
import { Workflow, WorkflowNode } from '../models/workflow';
import { HttpErrorResponse } from '@angular/common/http';
interface MyCallbacks extends NgFlowchart.Callbacks {
  onDrop?: (event: NgFlowchart.DropEvent) => void;
}
@Component({
  selector: 'app-workflows-interface',
  templateUrl: './workflows-interface.component.html',
  styleUrls: ['./workflows-interface.component.scss'],
  
  changeDetection: ChangeDetectionStrategy.OnPush,
})
  
export class WorkflowsInterfaceComponent implements AfterViewInit {
  @ViewChild('popupComponent') popupComponent: PopupComponent;
  @ViewChild('canvasContent', { static: true })
  canvasContent: NgFlowchartCanvasDirective;
  @ViewChild(NgFlowchartCanvasDirective)
  canvas: NgFlowchartCanvasDirective;
  title = 'workspace';
  currentWorkflowId: string | null = null;
  tag: string[] = [];
  selectedTags: string[] = [];  // To store the updated tags
  callbacks: MyCallbacks = {};
  showPopupModal = false;
  popupData: any = {};
  activeNode: string | null = null;
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
  nodeId: string;
  selectedTagDic : { [key: string]: string[] } = { };

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
        type: 'logger-Node',
        data: {
          name: 'State',
          inputs: [{
            description: 'Do action',
            tableName: "Reporting",
            columnName: "Report",
            actions: [{
              CrudCommandAction: { crud: "",condition:"" },
              operatorDecision: "",
              values: "",
              newValues: ""
            }]
          }],
          
        },
      }
    },
    {
      paletteName: 'Decision Node',
      step: {
        template: DecisionStepComponent,
        type: 'Decision-Node',
        data: {
          name: 'Decision',
          inputs: [{
            description: "Decision: ",
            tableName: "Reporting",
            columnName: "Report",
            actions: [{
              CrudCommandAction: { crud: "", condition: "" },
              operatorDecision: "",
              values: "value1",
              newValues: ""
            }]
          }],
          
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
    private formDataService:FormDataService
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
    this.loadWorkflows();

  }
  ngOnDestroy(): void {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
  }

  ngAfterViewInit() {
    this.stepRegistry.registerStep('logger-Node', NormalStepComponent);
    this.stepRegistry.registerStep('router', CustomStepComponent);
    this.stepRegistry.registerStep('nested-flow', NestedFlowComponent);
    this.stepRegistry.registerStep('form-step', FormStepComponent);
    this.stepRegistry.registerStep('route-step', RouteStepComponent);
    this.stepRegistry.registerStep('Decision-Node', DecisionStepComponent);

    this.autosaveInterval = setInterval(() => {
      this.SaveCurrentState();
    }, 3000);

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

  toggleToolbar(event: MouseEvent, nodeName: string) {
    if (this.activeNode === nodeName) {
      this.activeNode = null;
    } else {
      this.activeNode = nodeName;
      console.log(`Active node set to: ${this.activeNode}`);
    }
  }

  showPopup(event: MouseEvent) {
    event.stopPropagation();
    this.showPopupModal = true;
    this.popupData.title = 'Node Properties';
    this.settingsService.getAllCollections().subscribe(
      (response: any) => {
        this.popupData.options = Object.keys(response);
      },
      error => {
        console.error('Error fetching table names:', error);
      }
    );
  }

  openPopup(popupData: any) {
    this.popupData = popupData;
    this.showPopupModal = true;
  }

  closePopup() {
    this.showPopupModal = false;
  }

  updateTags(jsonObj: any) {
    const tagSet = new Set<string>(); 

    const collectTags = (node: any) => {
      if (node && node.data && Array.isArray(node.data.selectedColumnNames)) {
        node.data.selectedColumnNames.forEach((column: string) => tagSet.add(column));
      }
    };

    // Check and collect tags from the root
    if (jsonObj.root) {
      collectTags(jsonObj.root);
    }

    // Check and collect tags from the children recursively
    const traverseChildren = (node: any) => {
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => {
          collectTags(child); // Collect tags from the current child
          traverseChildren(child); // Recursively check the child's children
        });
      }
    };

    // Start traversal from the root node
    if (jsonObj.root && Array.isArray(jsonObj.root.children)) {
      traverseChildren(jsonObj.root);
    }

    // Convert the Set back to an array
    this.tag = Array.from(tagSet);

    console.log('Updated tags:', this.tag);

    if (this.tag.length === 0) {
      console.warn('No selected columns found in the workflow data.');
    }
  }



  saveWorkflow() {
    if (!this.currentWorkflowId && !this.workflowTitle.trim()) {
      alert('Workflow title is required.');
      return;
    }

    this.workflowService.getWorkflows().subscribe((workflows: any[]) => {
      const existingWorkflow = workflows.find(
        (workflow) => workflow.title.toLowerCase() === this.workflowTitle.trim().toLowerCase()
      );

      if (existingWorkflow && existingWorkflow.id !== this.currentWorkflowId) {
        this.toastr.error('Alert', 'A workflow with this title already exists. Please choose a different title.');
        return;
      }

      const flowchartId = this.currentWorkflowId || 's' + new Date().getTime();
      console.log(flowchartId);
      let flowData = this.canvas.getFlow().toJSON(4);
      let jsonObj = JSON.parse(flowData);

      
      this.updateTags(jsonObj);


      // Prepare save data
      const saveData = {
        id: flowchartId,
        title: this.workflowTitle,
        tag: this.tag,
        ...jsonObj
      };
      console.log('Saving workflow with data:', saveData);
      const savedData = JSON.stringify(saveData, null, 4);
      
     

      if (this.currentWorkflowId) {
        // Update tags from workflow before updating
        this.updateTagsFromWorkflow(flowchartId).then(() => {
          const updatedData = {
            id: flowchartId,
            title: this.workflowTitle,
            tag: this.tag,
            ...jsonObj
          };
          const updatedFlowData = JSON.stringify(updatedData, null, 4);
          console.log(updatedFlowData);
          this.workflowService.updateWorkflow(this.currentWorkflowId, updatedFlowData).subscribe(
            (response) => {
              console.log('Workflow updated successfully',response);
              this.loadWorkflows(this.currentWorkflowId);
              this.cd.detectChanges();
              this.closeSaveWorkflowPopup();
              this.toastr.success('Success', 'Workflow updated successfully!');
            },
            (error) => {
              console.error('Error updating workflow:', error);
              this.toastr.error('Error updating workflow');
            }
          );
        }).catch((error) => {
          console.error('Error updating tags from workflow:', error);
          this.toastr.error('Error updating tags from workflow');
        });
      } else {
        
        this.workflowService.saveWorkflow(savedData).subscribe(
          () => {
            console.log('Workflow saved successfully');
            this.closeSaveWorkflowPopup();
            this.cd.detectChanges();
            this.toastr.success('Success', 'Workflow saved successfully');
          },
          (error) => {
            console.error('Error saving workflow:', error);
            this.toastr.error('Error saving workflow');
          }
        );
      }
    });
  }


  updateTagsFromWorkflow(flowchartId: any): Promise<void> {
    return new Promise((resolve, reject) => {
      let flowData = this.canvas.getFlow().toJSON(4);
      let jsonObj = JSON.parse(flowData);
      
      const updatedDataForTag = {
        id: flowchartId,
        title: this.workflowTitle,
        tag: this.tag,
        ...jsonObj
      };
      this.workflowService.updateWorkflow(flowchartId, updatedDataForTag).subscribe({
        next: (response) => { 
          console.log('Workflow updated successfully', response);
        }
      })
      this.workflowService.getWorkflow(flowchartId).subscribe(
        (response: Workflow) => {
          console.log('Workflow Response:', response);
          this.processWorkflowNode(response.root, response); // Start processing from the root node
          this.cd.detectChanges();
          resolve(); // Resolve the promise when done
        },
        (error: HttpErrorResponse) => {
          console.error('Error fetching workflow:', error.message);
          reject(error); // Reject the promise on error
        }
      );
    });
  }



  processWorkflowNode(node: WorkflowNode, workflow: Workflow) {
    const validNodeIds: string[] = []; // Array to collect valid node IDs

    // Recursive function to process nodes and collect valid IDs
    const processNode = (node: WorkflowNode) => {
      if (node) {
        this.nodeId = node.id;
        validNodeIds.push(this.nodeId); // Collect the valid node ID
        const formDataKey = `step_${this.nodeId}_formData`; // Construct the key for form data
        console.log('Processing Node ID:', this.nodeId);
        console.log('FormData Key:', formDataKey);
        const savedFormData = this.formDataService.getFormData(formDataKey);
        console.log(savedFormData);
        if (savedFormData) {
          // Assuming `selectedColumns` is the key where selected columns are stored
          const selectedColumns = savedFormData['selectedColumnNames'];
          console.log('Selected Columns for Node ID:', this.nodeId, selectedColumns);

          if (selectedColumns && Array.isArray(selectedColumns)) {
            // Update the tags based on the selected columns
            this.selectedTags = selectedColumns; // Adjust according to your structure
            this.selectedTagDic[this.nodeId] = this.selectedTags;
            console.log(this.selectedTagDic);
            // Ensure selectedTags is an array of strings
            if (Array.isArray(this.selectedTags)) {
              const flattenedTags = Object.values(this.selectedTagDic).flat();
              workflow.tag = [...new Set(flattenedTags)]; // Remove duplicates if necessary
              this.tag = workflow.tag;
              console.log(this.tag);
            } else {
              console.warn('selectedTags is not an array of strings.');
            }

            // Example of displaying the updated tags
            console.log('Updated Tags for Node ID:', this.nodeId, this.selectedTags);
          } else {
            console.warn('Selected columns are not in the expected format for Node ID:', this.nodeId);
          }
        } else {
          console.warn('No form data found for Node ID:', this.nodeId);
        }

        // Recursively process child nodes
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(childNode => processNode(childNode));
        }
      }
    };

    // Start processing from the root node
    processNode(node);

    // Now, remove any nodeId in selectedTagDic that is not valid
    for (const key of Object.keys(this.selectedTagDic)) {
      if (!validNodeIds.includes(key)) {
        delete this.selectedTagDic[key];
        console.log(`Removed invalid nodeId: ${key} from selectedTagDic`);
      }
    }
  }





  showUpload(id) {
    this.workflowService.getWorkflow(id).subscribe(
      (data: any) => {
        this.sampleJson = data;
        console.log(this.sampleJson);
        this.workflowTitle = this.sampleJson.title || '';
        this.canvas.getFlow().upload(this.sampleJson);
      },
      (error) => {
        console.error('Error loading workflow:', error);
      }
    );
  }

  loadWorkflows(id?: string) {
    if (id) {
      this.currentWorkflowId = id;
      this.showUpload(id);
      this.SaveCurrentState();
    } else {
      this.workflowService.getWorkflows().subscribe(
        (data: any) => {
          this.workflows = data;
          console.log(this.workflows);
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error fetching workflows:', error);
        }
      );
    }
  }
  openSaveWorkflowPopup() {
    this.showSaveWorkflowPopup = true;
  }

  closeSaveWorkflowPopup() {
    this.showSaveWorkflowPopup = false;

  }
  deleteWorkflow(id: string) {
    console.log('Delete Workflow:', id);
    this.workflowService.deleteWorkflow(id).subscribe(() => {
      this.loadWorkflows();
      this.toastr.warning('This is a warning message.', 'Workflow deleted!');
    });
  }

  updateTitle(id: string) {
    this.editingWorkflowId = id;
    const workflow = this.workflows.find((w) => w.id === id);
    if (workflow) {
      this.editingWorkflowTitle = workflow.title;
    }
  }

  saveTitle(id: string) {
    const workflow = this.workflows.find((w) => w.id === id);
    if (workflow) {

      this.workflowService.getWorkflows().subscribe((workflows: any[]) => {
        const existingWorkflow = workflows.find(
          (w) => w.title.toLowerCase() === this.editingWorkflowTitle.toLowerCase()
        );

        if (existingWorkflow && existingWorkflow.id !== id) {
          this.toastr.error('A workflow with this title already exists. Please choose a different title.');
          return;
        }

        this.workflowService.updateWorkflow(id, workflow).subscribe(
          () => {

            workflow.title = this.editingWorkflowTitle.trim();
            console.log('Title updated successfully');
            this.toastr.success('Success', 'Workflow title updated successfully');
            this.editingWorkflowId = null; // Exit editing mode
          },
          (error) => {
            console.error('Error updating title:', error);
            this.toastr.error('Error updating title');
          }
        );
      });
    }
  }


  toggleDropdown(workflowId: number) {
    if (this.activeDropdown === workflowId) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = workflowId;
    }
  }

  isDropdownVisible(workflowId: number): boolean {
    return this.activeDropdown === workflowId;
  }

  undo(): void {
    if (this.dataCurrentArray.length > 1) {
      const currentState = this.dataCurrentArray.pop();
      this.dataRedoArray.push(currentState);
      const previousState = this.dataCurrentArray[this.dataCurrentArray.length - 1];
      this.canvas.getFlow().upload(previousState);

      this.showUndo = this.dataCurrentArray.length > 1;
      this.showRedo = true;
    }
  }



  redo(): void {
    if (this.dataRedoArray.length > 0) {
      const redoState = this.dataRedoArray.pop();
      this.dataCurrentArray.push(redoState);
      this.canvas.getFlow().upload(redoState);

      this.showRedo = this.dataRedoArray.length > 0;
      this.showUndo = true;
    }
  }

  SaveCurrentState() {
    const currentState = this.canvas.getFlow().toJSON();
    if (this.dataCurrentArray.length === 0) {
      this.dataCurrentArray.push(currentState);
    } else {
      const lastState = this.dataCurrentArray[this.dataCurrentArray.length - 1];
      if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
        this.dataCurrentArray.push(currentState);

        if (this.dataCurrentArray.length > this.undoLimit) {
          this.dataCurrentArray.shift();
        }
      }
    }

    this.showUndo = this.dataCurrentArray.length > 1;
    this.showRedo = false;
  }


  filteredWorkflows() {
    const term = this.searchTerm.toLowerCase();
    return this.workflows.filter(workflow => workflow.title.toLowerCase().includes(term));
  }
  reloadPage(): void {
    window.location.reload();
  }
}
