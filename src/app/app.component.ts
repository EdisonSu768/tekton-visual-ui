import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import * as go from 'gojs';
import { ObjectData } from 'gojs';
import { DataSyncService, DiagramComponent } from 'gojs-angular';
import { cloneDeep, first } from 'lodash-es';
import { tap } from 'rxjs/operators';

import { ApiService } from 'app/api/api.service';

@Component({
  selector: 'gojs-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  @ViewChild('myDiagram', { static: false })
  myDiagramComponent: DiagramComponent;

  diagramDivClassName = 'myDiagramDiv';
  diagramNodeData: go.ObjectData[] = [];
  diagramLinkData: go.ObjectData[] = [];
  diagramModelData: ObjectData = { prop: 'value' };
  selectedNode: go.Node | null = null; // currently selected node; for inspector
  skipsDiagramUpdate = false;

  pipeline$ = this.api.getTektonPipelineByNamespace('default').pipe(
    tap(() => {
      setTimeout(() => {
        this.myDiagramComponent?.diagram.addDiagramListener(
          'ChangedSelection',
          e => {
            if (e.diagram.selection.count === 0) {
              this.selectedNode = null;
            }
            const node = e.diagram.selection.first();
            if (node instanceof go.Node) {
              this.selectedNode = node;
              this.cdr.markForCheck();
            } else {
              this.selectedNode = null;
            }
          },
        );
      });
    }),
  );

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly api: ApiService,
  ) {}

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
      makePort('l', go.Spot.Left),
      makePort('r', go.Spot.Right),
    );

    return dia;
  }

  handleTasksToNodeData = (tasks: any[]): go.ObjectData[] => {
    this.diagramNodeData = tasks?.map((task: any) => {
      return {
        key: task?.name,
        color: 'lightblue',
      };
    });
    return this.diagramNodeData;
  };

  handleTasksToLinkData = (tasks: any[]): go.ObjectData[] => {
    this.diagramLinkData = tasks?.map((task: any, index) => {
      return {
        key: index,
        from: first(task?.runAfter),
        to: task?.name,
        fromPort: 'r',
        toPort: 'l',
      };
    });
    return this.diagramLinkData;
  };

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
}
