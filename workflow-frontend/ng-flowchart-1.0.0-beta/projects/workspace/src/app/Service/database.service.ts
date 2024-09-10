import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private apiUrl = 'http://localhost:5201/api/Database';

  constructor(private http: HttpClient) { }

  // Get All Collections
  getAllCollections(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/collections`);
  }
  // Get Column Names by Collection
  getColumnNamesByCollection(collectionName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/collections/${collectionName}/columns`);
  }

  // Get Possible Values by Table and Column
  getPossibleValuesByTableAndColumn(tableName: string, columnName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/collections/${tableName}/columns/${columnName}/values`);
  }
  updateColumnValue(tableName: string, columnName: string, oldValue: string, newValue: string): Observable<any> {
    const params = new HttpParams()
      .set('tableName', tableName)
      .set('columnName', columnName)
      .set('oldValue', oldValue)
      .set('newValue', newValue);

    return this.http.put(`${this.apiUrl}/updateColumnValue`, {}, { params });
  }
}
