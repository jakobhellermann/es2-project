import { Component } from '@angular/core';
import {Observable, ReplaySubject} from "rxjs";
import {ReactiveFormsModule} from "@angular/forms";
import {AsyncPipe, NgSwitch, NgSwitchCase} from "@angular/common";
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {MenuComponent} from "../components/menu/menu.component";
import {GridComponent} from "../grid/grid.component";
import {SingleComponent} from "../single/single.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    NgxBootstrapIconsModule,
    MenuComponent,
    GridComponent,
    SingleComponent,
    NgSwitchCase,
    NgSwitch
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  protected viewMode$ = new ReplaySubject<string>();
  protected _viewMode: Observable<string>;

  constructor() {
    this.viewMode$.next('single')
    this._viewMode = this.viewMode$.asObservable()
  }

  onViewMode(mode: string) {
    this.viewMode$.next(mode)
  }
}
