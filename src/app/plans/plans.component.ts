import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {PalladiumApiService} from '../../services/palladium-api.service';
import {Router} from '@angular/router';
import {ProductSettingsComponent} from '../products/products.component';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';
import {Plan} from '../models/plan';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlansComponent implements OnInit {
  selectedPlan = {id: 0};
  productId;
  plan_for_settings;
  _plans;
  RUN_COMPONENT;
  statuses;
  loading = false;

  constructor(private palladiumApiService: PalladiumApiService, private activatedRoute: ActivatedRoute,
              private router: Router, private dialog: MatDialog, private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.productId = params.id;
      this.init_data();
    });
  }

  plans = ():Plan[] => this.palladiumApiService.plans[this.productId];

  async get_plans(id) {
    this.palladiumApiService.get_plans(id).then(() => {
      this._plans = this.palladiumApiService.plans[this.productId] || [];
    });
  }

  get_suites(id) {
    return this.palladiumApiService.get_suites(id).then(suites => {
      return suites;
    });
  }

  get_statuses() {
    this.palladiumApiService.get_statuses().then(res => {
      this.statuses = res;
    });
  }

  clicked(event, plan) {
    if (!event.target.classList.contains('mat-icon') && !event.target.classList.contains('mat-icon-button')) {
      this.selectedPlan = plan;
      this.router.navigate(['plan', this.selectedPlan.id], {relativeTo: this.activatedRoute});
    }
  }

  count_of_cases(suites) {
    let casesCount = 0;
    suites.forEach(suite => {
      casesCount += suite.statistic.all;
    });
    return casesCount;
  }

  init_data() {
    this.loading = true;
    Promise.all([this.get_plans(this.productId), this.get_suites(this.productId), this.get_statuses()]).then(res => {
      this._plans.forEach(plan => {
        this.update_statistic(plan, this.count_of_cases(res[1][this.productId]));
      });
      const planId = this.router.url.match(/plan\/(\d+)/i);
      if (planId) {
        this.selectedPlan = this._plans.find(plan => plan.id === +planId[1]);
      }
      this.loading = false;
      this.cd.detectChanges();
    });
  }

  onActivate(componentRef) {
    this.RUN_COMPONENT = componentRef;
  }

  update_statistic(plan, casesCount) {
    if (plan.all_statistic['all'] < casesCount) {
      const untested = casesCount - plan.all_statistic['all'];
      plan.statistic.push({plan_id: plan.id, status: 0, count: untested});
      plan.get_statistic();
    }
    return (plan);
  }

  force_floor(data) {
    return (Math.floor(data * 100) / 100);
  }

  open_settings() {
    const dialogRef = this.dialog.open(PlansSettingsComponent, {
      data: {
        plans: this._plans,
        plan: this.plan_for_settings
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._plans = result;
      }
    });
  }

  get_status_by_id(id) {
    return this.statuses.find(status => status.id === +id);
  }

  async load_more_plans() {
    console.log('load_more_plans')
    // async this.palladiumApiService.get_plans(this.productId, this.plans.length);
  }
}


@Component({
  selector: 'app-plan-settings',
  templateUrl: 'plans-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PlansSettingsComponent implements OnInit {
  plan;
  item;
  _plans;
  planForm = new FormGroup({
    name: new FormControl('',  [Validators.required])
  });
  constructor(public dialogRef: MatDialogRef<ProductSettingsComponent>,
              private palladiumApiService: PalladiumApiService, private router: Router, @Inject(MAT_DIALOG_DATA) public data) {}

  ngOnInit(): void {
    this._plans = this.data.plans;
    this.item = this.data.plan;
    this.planForm.patchValue({name: this.item.name});
  }

  get name() { return this.planForm.get('name'); }

  async edit_plan() {
    if (!this.name_is_not_changed()) {
      const plan = await this.palladiumApiService.edit_plan(this.item.id, this.name.value);
      this._plans.filter(x => x.id === plan.id)[0].name = plan.name;
    }
    this.dialogRef.close(this._plans);
  }

  name_is_existed() {
    if (this.item) {
      if (this.name_is_not_changed()) { return false; }
      return this._plans.some(product => product.name === this.name.value);
    }
  }

  name_is_not_changed() {
    return this.item.name === this.name.value;
  }

  check_existing() {
    if (this.name_is_existed()) {
      this.planForm.controls['name'].setErrors({'incorrect': true});
    }
  }

  async delete_plan() {
    if (confirm('A u shuare?')) {
      await this.palladiumApiService.delete_plan(this.item.id);
      this._plans = this._plans.filter(currentPlan => currentPlan.id !== this.item.id);
      this.router.navigate([/(.*?)(?=plan|$)/.exec(this.router.url)[0]]);
      this.dialogRef.close(this._plans);
    }
  }
}
