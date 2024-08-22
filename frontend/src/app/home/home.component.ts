import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {Observable, ReplaySubject, tap} from "rxjs";
import {ReactiveFormsModule, UntypedFormControl} from "@angular/forms";
import {AssistantResponse, BotService} from "../service/bot.service";
import {AsyncPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {AudioService} from "../service/audio.service";
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {MenuComponent} from "../components/menu/menu.component";
import {GridComponent} from "../grid/grid.component";
import {ChatComponent} from "../components/chat/chat.component";
import {SingleComponent} from "../single/single.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    NgForOf,
    NgClass,
    NgIf,
    NgbTooltip,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgxBootstrapIconsModule,
    MenuComponent,
    GridComponent,
    ChatComponent,
    SingleComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  /*test() {
    const text = this.textInput.value;

    this.insertRequest(text);

    this.messages.push({
      message: '',
      reply: true,
      telemetry: null,
      loading: false
    });

    this.messages$.next(this.messages)

    this.botService.test(text, (res) => {
      const lastMessage = this.messages[this.messages.length - 1];

      lastMessage.message += res;
    })
  }*/
}
