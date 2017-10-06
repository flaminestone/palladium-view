import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {Run} from '../models/run';
import {Suite} from '../models/suite';
import {NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {PalladiumApiService} from '../../services/palladium-api.service';
import {StatusticService} from '../../services/statistic.service';
import {Subscription} from 'rxjs/Subscription';
import {Statistic} from '../models/statistic';

declare var $: any;

@Component({
  selector: 'app-runs',
  templateUrl: './runs.component.html',
  styleUrls: ['./runs.component.css'],
  providers: [StatusticService]
})
export class RunsComponent implements OnInit {
  runs = [];
  suites = [];
  runs_and_suites = [];
  statuses;
  run_settings_data = {};
  statistic: Statistic;
  subscription: Subscription;

  constructor(private ApiService: PalladiumApiService, private activatedRoute: ActivatedRoute,
              private router: Router, public stat: StatusticService) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.get_runs_and_suites(params['id']);
    });
    if (this.router.url.indexOf('/suite/') >= 0 || this.router.url.indexOf('/run/') >= 0 && this.router.url.indexOf('/result_set/') <= 0) {
      $('.product-space').removeClass('very-big-column small-column').addClass('big-column');
      $('.plan-space').removeClass('small-column very-big-column').addClass('big-column');
      $('.run-space').removeClass('big-column small-column').addClass('very-big-column');
    }
    this.subscription = this.stat.getMessage().subscribe(statistic => {
      const id = this.router.url.match(/run\/(\d+)/i)[1];
      if (id !== null) {
        Object(this.runs_and_suites).forEach(obj => {
          if (obj.constructor.name === 'Run' && obj.id === +id) {
            obj.statistic = statistic;
          }
        });
        this.statistic = statistic;
      }
    });
  }

  get_statuses() {
    return this.ApiService.get_statuses().then(res => {
      res[0] = {name: 'Untested', color: '#ffffff', id: 0}; // add untested status. FIXME: need to added automaticly
      return res;
    });
  }

  get_runs(plan_id) {
    return this.ApiService.get_runs(plan_id).then(runs => { return runs; });
  }

  get_suites(plan_id) {
    return this.ApiService.get_suites(plan_id).then(suites => { return suites; });
  }

  get_runs_and_suites(plan_id) {
    Promise.all([this.get_runs(plan_id), this.get_suites(plan_id), this.get_statuses()]).then(res => {
      console.log(res);
      this.statuses = res[2];
      const suite_for_add = [];
      res[1].forEach(suite => {
        this.suites.push(suite);
        const same = res[0].filter(run => run.name === suite.name);
        if (same.length === 0) {
          suite_for_add.push(suite);
        } else if (same[0].statistic.all !== suite.statistic.all) {
          const untested = suite.statistic.all - same[0].statistic.all;
          same[0].statistic.add_status('0', untested);
        }
      });
      this.runs_and_suites = res[0].concat(suite_for_add);
    });
  }

  delete_object(modal) {
    if (confirm('A u shuare?')) {
      if (this.run_settings_data['object'].constructor.name === 'Suite') {
        this.ApiService.delete_suite(this.run_settings_data['id']).then(suite => {
          this.runs_and_suites.splice(this.run_settings_data['index'], 1);
          if (this.router.url.indexOf('/suite/' + suite['id']) >= 0) {
            this.router.navigate([/(.*?)(?=suite|$)/.exec(this.router.url)[0]]);
          }
        });
        modal.close();
      } else {
        this.ApiService.delete_run(this.run_settings_data['id']).then(run => {
          this.runs_and_suites[this.run_settings_data['index']] = this.suites.filter(
            suite => suite.name === this.runs_and_suites[this.run_settings_data['index']].name)[0];
          if (this.router.url.indexOf('/run/' + run['run']) >= 0) {
            this.router.navigate([/(.*?)(?=run|$)/.exec(this.router.url)[0]]);
          }
        });
      }
      modal.close();
    }
  }

  edit_run(form: NgForm, modal, valid: boolean) {
    if (!valid) {
      return;
    }
    if (this.run_settings_data['object'].constructor.name === 'Run') {
      this.ApiService.edit_suite_by_run_id(this.run_settings_data['id'], form.value['run_name']).then(suite => {
        const object_for_change = this.runs_and_suites.filter(object => object.id === this.run_settings_data['id'])[0];
        object_for_change.name = suite.name;
        object_for_change.updated_at = suite.updated_at;
      });
    } else {
      this.ApiService.edit_suite(this.run_settings_data['id'], form.value['run_name']).then(suite => {
        const object_for_change = this.runs_and_suites.filter(object => object.id === this.run_settings_data['id'])[0];
        object_for_change.name = suite.name;
        object_for_change.updated_at = suite.updated_at;
      });
    }
    modal.close();
  }

  show_settings_button(index) {
    $('#' + index + '.run-setting-button').show();
  };

  hide_settings_button(index) {
    $('#' + index + '.run-setting-button').hide();
  };

  settings(modal, run, index, form) {
    this.run_settings_data = {object: run, id: run.id, index: index};
    modal.open();
    form.controls['run_name'].setValue(run.name);
  }

  set_space_width() {
    $('.lost-result').show();
    $('.product-space').removeClass('very-big-column').addClass('big-column');
    $('.plan-space').removeClass('very-big-column small-column').addClass('big-column');
    $('.run-space').removeClass('big-column small-column').addClass('very-big-column');
  }

  log(val) {
    console.log(val);
  }
}
