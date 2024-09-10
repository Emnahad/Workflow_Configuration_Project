import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CheckHistoric } from '../models/checkHistoric';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private apiUrl = 'http://localhost:5201/api/Workflow';

  constructor(private http: HttpClient) { }
  getWorkflows(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getWorkflow(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  saveWorkflow(workflow: any): Observable<any> {
    return this.http.post(this.apiUrl, workflow, {
      headers: { 'Content-Type': 'application/json' }
    });
  }


  updateWorkflow(id: string, workflow: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, workflow, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  deleteWorkflow(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  extractWorkflowsByTag(displayedColumns: string[]): Observable<any> {
    let params = new HttpParams();

    displayedColumns.forEach(column => {
      params = params.append('displayedColumns', column);
    });

    return this.http.get(`${this.apiUrl}/extract`, { params });
  }
  traverseAndUpdate(node: any, row: any, workflow: any,  errorMessages: string[], finalResultMessage: string): Observable<CheckHistoric | null> {
    const payload = {
      node,
      row,
      workflow,
      errorMessages,
      finalResultMessage
    };
    return this.http.post<CheckHistoric | null>(`${this.apiUrl}/traverse`, payload);
  }


}
