import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as go from 'gojs';

@Component({
  selector: 'app-inspector',
  templateUrl: 'component.html',
  styleUrls: ['component.scss'],
})
export class InspectorComponent {
  _selectedNode: go.Node;
  data = {
    key: null,
    color: null,
  };

  @Input()
  model: go.Model;

  @Output()
  onFormChange: EventEmitter<any> = new EventEmitter<any>();

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
    this.onFormChange.emit(this.data);
  }
}
