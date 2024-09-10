import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgFlowchartModule } from 'projects/ng-flowchart/src/lib/ng-flowchart.module';
import { AppComponent } from './app.component';
import { CustomStepComponent } from './custom-step/custom-step.component';
import { DecisionStepComponent } from './custom-step/decision-step/decision-step.component';
import { RouteStepComponent } from './custom-step/route-step/route-step.component';
import { NestedFlowComponent } from './nested-flow/nested-flow/nested-flow.component';
import { FormStepComponent } from './form-step/form-step.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PopupComponent } from './Popup/popup/popup.component';
import { NormalStepComponent } from './normal-step/normal-step/normal-step.component';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { WorkflowsInterfaceComponent } from './workflows-interface/workflows-interface.component';
import { TableInterfaceComponent } from './table-interface/table-interface.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from './navbar/navbar/navbar.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PopupCheckResultComponent } from './popup-checkResult/popup-check-result/popup-check-result.component';
import { CheckResultsComponent } from './check-Results/check-results/check-results.component';
@NgModule({
  declarations: [
    AppComponent,
    CustomStepComponent,
    DecisionStepComponent,
    RouteStepComponent,
    NestedFlowComponent,
    FormStepComponent,
    PopupComponent,
    NormalStepComponent,
    WorkflowsInterfaceComponent,
    TableInterfaceComponent,
    NavbarComponent,
    PopupCheckResultComponent,
    CheckResultsComponent,
  ],
  imports: [BrowserModule, NgFlowchartModule, FormsModule, HttpClientModule, DragDropModule, ToastrModule.forRoot(), BrowserAnimationsModule, MatFormFieldModule,
    MatSelectModule, MatTableModule,
    MatPaginatorModule,
    MatSortModule, MatDialogModule, MatButtonModule, MatInputModule, MatRadioModule, ReactiveFormsModule,
    AppRoutingModule, RouterModule,MatIconModule],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] 

})
export class AppModule {}
