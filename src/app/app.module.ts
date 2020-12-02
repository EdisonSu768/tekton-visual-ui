import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { GojsAngularModule } from 'gojs-angular';

import { InspectorComponent } from './inspector/component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [AppComponent, InspectorComponent],
  imports: [BrowserModule, FormsModule, GojsAngularModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
