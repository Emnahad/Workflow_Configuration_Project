import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkflowsInterfaceComponent } from './workflows-interface/workflows-interface.component';
import { TableInterfaceComponent } from './table-interface/table-interface.component';
import { CheckResultsComponent } from './check-Results/check-results/check-results.component';

const routes: Routes = [
    { path: 'workflows-interface', component: WorkflowsInterfaceComponent },
    { path: 'table-interface', component: TableInterfaceComponent },
    { path: 'check-results', component: CheckResultsComponent },
    { path: '', redirectTo: '/workflows-interface', pathMatch: 'full' }  // Optional: Redirect to default route
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
