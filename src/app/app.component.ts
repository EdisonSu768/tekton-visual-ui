import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import * as go from 'gojs';
import { ObjectData } from 'gojs';
import { DataSyncService, DiagramComponent } from 'gojs-angular';
import { cloneDeep, first } from 'lodash-es';
import * as R from 'ramda';
import { Subject, Subscription } from 'rxjs';
import {
  delay,
  map,
  publishReplay,
  refCount,
  switchMap,
  tap,
} from 'rxjs/operators';

import { ApiService } from 'app/api/api.service';

@Component({
  selector: 'gojs-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('myDiagram', { static: false })
  myDiagramComponent: DiagramComponent;

  diagramDivClassName = 'myDiagramDiv';
  diagramNodeData: go.ObjectData[] = [];
  diagramLinkData: go.ObjectData[] = [];
  diagramModelData: ObjectData = { prop: 'value' };
  selectedNode: go.Node | null = null; // currently selected node; for inspector
  skipsDiagramUpdate = false;

  fetchPipelineRun$ = new Subject<void>();
  private readonly subscriptions: Subscription[] = [];

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

  lastPipelineRun$ = this.fetchPipelineRun$.pipe(
    switchMap(() => {
      return this.api.getTektonPipelineRunByNamespace('default');
    }),
    map(items => {
      return (items as any[]).sort(
        (a, b) =>
          (new Date(b.metadata.creationTimestamp) as any) -
          (new Date(a.metadata.creationTimestamp) as any),
      );
    }),
    map(items => first(items)),
    map((item: any) => item.metadata.name),
    publishReplay(1),
    refCount(),
  );

  taskRun$ = this.lastPipelineRun$.pipe(
    switchMap(pipelineRun => {
      console.log('pipelineRun -->', pipelineRun);
      return this.api
        .getTektonTaskRunByPipelineRun(pipelineRun, 'default')
        .pipe(
          map((items: any[]) => {
            return items.map(item => {
              return {
                name: item.metadata.labels['tekton.dev/pipelineTask'],
                // @ts-ignore
                status: first(item.status?.conditions)?.reason,
              };
            });
          }),
        );
    }),
    publishReplay(1),
    refCount(),
  );

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly api: ApiService,
  ) {}

  ngAfterViewInit() {
    this.fetchPipelineRun$.next();
  }

  ngOnInit() {
    this.subscriptions.push(
      this.lastPipelineRun$
        .pipe(delay(5 * 1000))
        .subscribe(() => this.fetchPipelineRun$.next()),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  initDiagram(): go.Diagram {
    const $ = go.GraphObject.make;
    const dia = $(go.Diagram, {
      initialContentAlignment: go.Spot.Default,
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
      {},
      new go.Binding('location', 'loc'),
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

  getColor(status: string) {
    switch (status?.toLowerCase()) {
      case 'succeeded':
        return 'green';
      case 'failed':
        return 'red';
      case 'running':
        return 'blue';
      case 'pending':
        return 'gray';
      default:
        return 'gray';
    }
  }

  handleTasksToNodeData = (tasks: any[], taskRun: any[]): go.ObjectData[] => {
    const taskStep = tasks.map(task => task.name);
    const taskRunSort = R.sortBy(
      // @ts-ignore
      R.pipe(R.prop('name'), R.indexOf(R.__, taskStep)),
    )(taskRun);
    this.diagramNodeData = taskRunSort?.map((task: any, index: number) => {
      return {
        key: task?.name,
        color: this.getColor(task?.status),
        loc: new go.Point(index * 150, 200),
      };
    });
    this.cdr.markForCheck();
    this.skipsDiagramUpdate = false;
    console.log('NODE -->', this.diagramNodeData);
    return this.diagramNodeData;
  };

  handleTasksToLinkData = (tasks: any[], taskRun: any[]): go.ObjectData[] => {
    this.diagramLinkData = taskRun
      ?.map((run: any, index) => {
        let obj = null;
        tasks.forEach(task => {
          if (task.name === run.name && task.runAfter) {
            obj = {
              key: index,
              from: first(task.runAfter),
              to: run?.name,
              fromPort: 'r',
              toPort: 'l',
            };
          }
        });
        return obj;
      })
      .filter(t => t !== null);
    this.cdr.markForCheck();
    this.skipsDiagramUpdate = false;
    console.log('LINK -->', this.diagramLinkData);
    return this.diagramLinkData;
  };

  handleInspectorChange(newNodeData: ObjectData) {
    console.log('### handleInspectorChange ###', newNodeData);
    this.diagramNodeData.forEach((node, i) => {
      // find the entry in nodeDataArray with this key, replace it with newNodeData
      if (node?.key === newNodeData.key) {
        this.skipsDiagramUpdate = false; // here, we set skipsDiagramUpdate to false, since GoJS does not yet have this update
        this.diagramNodeData[i] = cloneDeep(newNodeData);
      }
    });
  }

  // When the diagram model changes, update app data to reflect those changes
  diagramModelChange = (changes: go.IncrementalData) => {
    console.log('### diagramModelChange ###', changes);
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
