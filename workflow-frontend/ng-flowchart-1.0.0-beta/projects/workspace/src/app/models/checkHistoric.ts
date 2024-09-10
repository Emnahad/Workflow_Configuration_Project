export interface CheckHistoric {
    id: string;
    checkName: string;
    checkDate: string; 
    workflowTitle: string;
    workflowCheckResult: {
        id: string;
        successResult: string;
        errorMessages: string[];
    };
}