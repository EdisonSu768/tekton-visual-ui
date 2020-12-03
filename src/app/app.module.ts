import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { GojsAngularModule } from 'gojs-angular';

import { ApiModule } from 'app/api/api.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InspectorComponent } from './inspector/component';

@NgModule({
  declarations: [AppComponent, InspectorComponent],
  imports: [
    HttpClientModule,
    BrowserModule,
    FormsModule,
    GojsAngularModule,
    AppRoutingModule,
    ApiModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
