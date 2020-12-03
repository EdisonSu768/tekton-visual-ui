import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import * as go from 'gojs';
import { ObjectData } from 'gojs';

@Component({
  selector: 'gojs-inspector',
  templateUrl: 'component.html',
  styleUrls: ['component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorComponent {
  _selectedNode: go.Node;
  data: ObjectData = {
    key: null,
    color: null,
  };

  @Input()
  model: go.Model;

  @Output()
  formChange = new EventEmitter<ObjectData>();

  @Input()
  get selectedNode() {
    return this._selectedNode;
  }

  set selectedNode(node: go.Node) {
    if (node) {
      this._selectedNode = node;
      this.data.key = this._selectedNode.data.key;
      this.data.color = this._selectedNode.data.color;
    } else {
      this._selectedNode = null;
      this.data.key = null;
      this.data.color = null;
    }
  }

  onCommitForm() {
    this.formChange.emit(this.data);
  }
}
