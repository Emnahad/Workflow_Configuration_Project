import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormDataService {
  private formData: { [key: string]: any } = {};
  private persistentKey = 'persistentFormData';

  setFormData(key: string, data: any) {
    // Save data to in-memory storage
    this.formData[key] = data;

    // Retrieve existing data from local storage
    const existingData = this.getPersistentData();

    // Update the data with the new entry
    existingData[key] = data;

    // Store the updated data in local storage
    localStorage.setItem(this.persistentKey, JSON.stringify(existingData));

    console.log('localStorage is :', localStorage);
  }

  getFormData(key: string) {
    // Retrieve data from local storage
    const persistentData = this.getPersistentData();

    // Return the data if it exists in local storage
    if (persistentData && persistentData[key]) {
      return persistentData[key];
    }

    // Fallback to in-memory storage
    return this.formData[key];
  }

  clearFormData(key: string) {
    // Remove data from in-memory storage
    delete this.formData[key];

    // Retrieve existing data from local storage
    const existingData = this.getPersistentData();

    // Remove the key from the stored data
    if (existingData && existingData[key]) {
      delete existingData[key];
    }

    // Update the local storage with the remaining data
    localStorage.setItem(this.persistentKey, JSON.stringify(existingData));
  }

  public getPersistentData(): { [key: string]: any } {
    const data = localStorage.getItem(this.persistentKey);
    return data ? JSON.parse(data) : {};
  }
}
