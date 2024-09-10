import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CheckHistoric } from '../models/checkHistoric';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CheckHistoricService {
 private apiUrl = 'http://localhost:5201/api/CheckHistoric';

  constructor(private http: HttpClient) { }
  createCheckHistoric(checkHistoric: CheckHistoric): Observable<CheckHistoric> {
    return this.http.post<CheckHistoric>(`${this.apiUrl}`, checkHistoric);
  }

  // Read a CheckHistoric entry by its ID
  getCheckHistoric(id: string): Observable<CheckHistoric> {
    return this.http.get<CheckHistoric>(`${this.apiUrl}/${id}`);
  }

  // Update an existing CheckHistoric entry
  updateCheckHistoric(checkHistoric: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${checkHistoric.id}`, checkHistoric);
  }

  // Delete a CheckHistoric entry by its ID
  deleteCheckHistoric(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Optionally, you can create a method to get all CheckHistoric entries
  getAllCheckHistorics(): Observable<CheckHistoric[]> {
    return this.http.get<CheckHistoric[]>(`${this.apiUrl}`);
  }
}
