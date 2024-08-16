import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {HttpClientModule} from "@angular/common/http";
import {allIcons, NgxBootstrapIconsModule} from "ngx-bootstrap-icons";

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), importProvidersFrom(HttpClientModule, NgxBootstrapIconsModule.pick(allIcons))]
};
