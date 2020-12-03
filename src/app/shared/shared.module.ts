import { NgModule } from '@angular/core';

import { PurePipe } from 'app/shared/pure.pipe';

@NgModule({
  declarations: [PurePipe],
  exports: [PurePipe],
})
export class SharedModule {}
