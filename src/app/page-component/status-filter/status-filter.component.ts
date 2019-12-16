import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {Point} from 'app/models/statistic';
import {PalladiumApiService, StructuredStatuses} from '../../../services/palladium-api.service';
import {Observable, Subscription} from "rxjs";

@Component({
  selector: 'app-status-filter',
  templateUrl: './status-filter.component.html',
  styleUrls: ['./status-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusFilterComponent implements OnInit {
  @Input() point: Point;
  selected: boolean;
  statuses$: Observable<StructuredStatuses>;

  constructor(private palladiumApi: PalladiumApiService, private cd: ChangeDetectorRef) { }


  ngOnInit() {
    console.log('this.point')
    console.log(this.point)
    this.statuses$ = this.palladiumApi.statuses$.pipe();
  }


  get_background_color() {
    if (this.point.active) {
      return this.palladiumApi.statuses[this.point.status].color;
    }
  }
}
