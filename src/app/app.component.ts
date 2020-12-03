import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import * as go from 'gojs';
import { ObjectData } from 'gojs';
import { DataSyncService, DiagramComponent } from 'gojs-angular';
import { cloneDeep } from 'lodash-es';

@Component({
  selector: 'gojs-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  @ViewChild('myDiagram', { static: true })
  myDiagramComponent: DiagramComponent;

  initDiagram(): go.Diagram {
    const $ = go.GraphObject.make;
    const dia = $(go.Diagram, {
      'undoManager.isEnabled': true,
      model: $(go.GraphLinksModel, {
        linkToPortIdProperty: 'toPort',
        linkFromPortIdProperty: 'fromPort',
        linkKeyProperty: 'key', // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
      }),
    });
    dia.commandHandler.archetypeGroupData = { key: 'Group', isGroup: true };

    const makePort = (id: string, spot: go.Spot) => {
      return $(go.Shape, 'Circle', {
        opacity: 0.5,
        fill: 'gray',
        strokeWidth: 0,
        desiredSize: new go.Size(8, 8),
        portId: id,
        alignment: spot,
        fromLinkable: true,
        toLinkable: true,
      });
    };

    // define the Node template
    dia.nodeTemplate = $(
      go.Node,
      'Spot',
      {
        contextMenu: $(
          'ContextMenu',
          $(
            'ContextMenuButton',
            $(go.TextBlock, 'Group'),
            {
              click: (e, _obj) => {
                e.diagram.commandHandler.groupSelection();
              },
            },
            new go.Binding(
              'visible',
              '',
              o => o.diagram.selection.count > 1,
            ).ofObject(),
          ),
        ),
      },
      $(
        go.Panel,
        'Auto',
        $(
          go.Shape,
          'RoundedRectangle',
          { stroke: null },
          new go.Binding('fill', 'color'),
        ),
        $(go.TextBlock, { margin: 8 }, new go.Binding('text', 'key')),
      ),
      // Ports
      makePort('t', go.Spot.TopCenter),
      makePort('l', go.Spot.Left),
      makePort('r', go.Spot.Right),
      makePort('b', go.Spot.BottomCenter),
    );

    return dia;
  }

  diagramNodeData: go.ObjectData[] = [
    { key: 'Alpha', color: 'lightblue', arr: [1, 2] },
    { key: 'Beta', color: 'orange' },
    { key: 'Gamma', color: 'lightgreen' },
    { key: 'Delta', color: 'pink' },
  ];

  diagramLinkData: go.ObjectData[] = [
    { key: -1, from: 'Alpha', to: 'Beta', fromPort: 'r', toPort: '1' },
    { key: -2, from: 'Alpha', to: 'Gamma', fromPort: 'b', toPort: 't' },
    { key: -3, from: 'Beta', to: 'Beta' },
    { key: -4, from: 'Gamma', to: 'Delta', fromPort: 'r', toPort: 'l' },
    { key: -5, from: 'Delta', to: 'Alpha', fromPort: 't', toPort: 'r' },
  ];

  diagramDivClassName = 'myDiagramDiv';
  diagramModelData: ObjectData = { prop: 'value' };
  skipsDiagramUpdate = false;

  // When the diagram model changes, update app data to reflect those changes
  diagramModelChange = (changes: go.IncrementalData) => {
    // when setting state here, be sure to set skipsDiagramUpdate: true since GoJS already has this update
    // (since this is a GoJS model changed listener event function)
    // this way, we don't log an unneeded transaction in the Diagram's undoManager history
    this.skipsDiagramUpdate = true;

    this.diagramNodeData = DataSyncService.syncNodeData(
      changes,
      this.diagramNodeData,
    );
    this.diagramLinkData = DataSyncService.syncLinkData(
      changes,
      this.diagramLinkData,
    );
    this.diagramModelData = DataSyncService.syncModelData(
      changes,
      this.diagramModelData,
    );
  };

  constructor(private readonly cdr: ChangeDetectorRef) {}

  // currently selected node; for inspector
  selectedNode: go.Node | null = null;

  ngAfterViewInit() {
    this.cdr.detectChanges(); // IMPORTANT: without this, Angular will throw ExpressionChangedAfterItHasBeenCheckedError (dev mode only)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const appComp: AppComponent = this;
    // listener for inspector
    this.myDiagramComponent.diagram.addDiagramListener(
      'ChangedSelection',
      e => {
        if (e.diagram.selection.count === 0) {
          appComp.selectedNode = null;
        }
        const node = e.diagram.selection.first();
        if (node instanceof go.Node) {
          appComp.selectedNode = node;
        } else {
          appComp.selectedNode = null;
        }
      },
    );
  } // end ngAfterViewInit

  handleInspectorChange(newNodeData: ObjectData) {
    const key = newNodeData.key;
    // find the entry in nodeDataArray with this key, replace it with newNodeData
    let index = null;
    for (let i = 0; i < this.diagramNodeData.length; i++) {
      const entry = this.diagramNodeData[i];
      if (entry.key && entry.key === key) {
        index = i;
      }
    }

    if (index >= 0) {
      // here, we set skipsDiagramUpdate to false, since GoJS does not yet have this update
      this.skipsDiagramUpdate = false;
      this.diagramNodeData[index] = cloneDeep(newNodeData);
    }
  }
}
