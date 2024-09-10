import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = 'http://localhost:5201/api/settings'; 

  constructor(private http: HttpClient) { }

  // Get All Collections
  getAllCollections(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/collections`);
  }
  // Get Column Names by Collection
  getColumnNamesByCollection(collectionName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/metadata/${collectionName}/columns`);
  }

  // Get Possible Values by Table and Column
  getPossibleValuesByTableAndColumn(tableName: string, columnName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/metadata/${tableName}/${columnName}/values`);
  }
  
  getColumnNamesAndTypesByCollection(collectionName: string): Observable<{ [key: string]: string }> {
    const url = `${this.apiUrl}/columns-and-types/${collectionName}`;
    return this.http.get<{ [key: string]: string }>(url);
  }
 
}
