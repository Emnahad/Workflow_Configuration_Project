export interface Workflow {
    id: string;
    title?: string;
    tag: string[];
    root: WorkflowNode;
    connectors: Connector[];
    originalNodeIdMappings: { [key: string]: string };  
}

export interface WorkflowNode {
    id: string;
    type: string;
    data: NodeData;
    children: WorkflowNode[];
}

export interface Connector {
    startStepId: string;
    endStepId: string;
}

export interface NodeData {
    name: string;  
    inputs: ColumnActions[]; 
}

export interface ColumnActions {
    tableName: string;
    columnName: string;
    description: string;  
    actions: ActionItems[]; 
}

export interface ActionItems {
    crudCommandAction: ActionKeyWords;  
    operatorDecision?: string; 
    values: string[];  
    newValues?: { [key: string]: string };  
}

export interface ActionKeyWords {
    crud: string;
    condition?: string;  
}
