import {Component, OnInit, AfterViewInit, ViewChild, ElementRef} from '@angular/core';
import {NgForm} from '@angular/forms';
import {ResultSet} from '../models/result_set';
import {Case} from '../models/case';
import {Statistic} from '../models/statistic';
import {Router} from '@angular/router';
import {ActivatedRoute, Params} from '@angular/router';
import {PalladiumApiService} from '../../services/palladium-api.service';
import {HttpService} from '../../services/http-request.service';
import {StatusFilterPipe} from '../pipes/status_filter_pipe/status-filter.pipe';
import {StatusSelectorComponent} from '../page-component/status-selector/status-selector/status-selector.component';
import {StatusticService} from '../../services/statistic.service';

declare var $: any;

@Component({
  selector: 'app-result-sets',
  templateUrl: './result-sets.component.html',
  styleUrls: ['./result-sets.component.css'],
  providers: [PalladiumApiService, StatusFilterPipe]
})

export class ResultSetsComponent implements OnInit, AfterViewInit {
  @ViewChild('Selector')
  private Selector: StatusSelectorComponent;
  run_id = null;
  result_sets: ResultSet[] = [];
  errorMessage;
  result_set_settings_data = {};
  statuses;
  all_statuses;
  statuses_array = [];
  result_sets_and_cases = [];
  statistic: Statistic;
  selected_counter = [];
  selected_status_id = null;
  filter: any[] = [];
  constructor(private activatedRoute: ActivatedRoute, private httpService: HttpService, public stat: StatusticService,
              private ApiService: PalladiumApiService, private router: Router, private _eref: ElementRef) {
  }
 // FIXME: https://github.com/valor-software/ng2-select/pull/712
  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.result_sets = [];
      this.result_sets_and_cases = [];
      this.run_id = params.id;
      this.get_result_sets(this.run_id);
      this.ApiService.get_statuses().then(res => {
        this.statuses = JSON.parse(JSON.stringify(res));
        this.all_statuses = JSON.parse(JSON.stringify(res));
        this.statuses_array = Object.keys(this.statuses);
        this.statuses['0'] = {name: 'Untested', color: '#ffffff', id: 0}; // add untested status. FIXME: need to added automaticly
      });
    });
    if (this.router.url.indexOf('/result_set/') >= 0) {
      $('.product-space').removeClass('very-big-column big-column').addClass('small-column');
      $('.plan-space').removeClass('very-big-column big-column').addClass('small-column ');
      $('.run-space').removeClass('very-big-column small-column').addClass('big-column');
    }
  }

  ngAfterViewInit() {
    $('.result_sets_list').css('height', $('#main-container').innerHeight() - 120);
  }
  test() {
    this.stat.delete_object(new ResultSet(null));
  }
  getStyles(object) {
    if (this.statuses && object['status']) {
      return {'box-shadow': 'inset 0 0 10px ' + this.statuses[object['status']].color};
    }
  }
  get_result_sets(run_id) {
    this.ApiService.get_result_sets(run_id).then(result_sets => {
      this.result_sets = result_sets;
      return result_sets;
    }).then(result_sets => {
      return this.activatedRoute.parent.parent.params.subscribe(params => {
        this.get_result_sets_and_cases(run_id, params['id']);
      });
    });
  }

  delete_result_set(modal) {
    if (this.result_set_settings_data['object'].constructor.name === 'ResultSet') {
      if (confirm('A u shuare?')) {
        this.httpService.postData('/result_set_delete', 'result_set_data[id]=' + this.result_set_settings_data['id'])
          .then(
            result_sets => {
              this.result_sets_and_cases[this.result_set_settings_data['index']] = new Case(this.result_set_settings_data['object']);
              if (this.router.url.indexOf('/result_set/' + result_sets['result_set']) === -1) {
                this.router.navigate([/(.*?)(?=result_set|$)/.exec(this.router.url)[0]]);
              }
              // this.stat.delete_object(new ResultSet(null));
              this.statistic = new Statistic(this.result_sets_and_cases);
              console.log(this.statistic);
            },
            error => this.errorMessage = <any>error);
        modal.close();
      }
    } else {
      if (confirm('A u shuare?')) {
        this.ApiService.delete_case(this.result_set_settings_data['id']).then(res => {
          this.result_sets_and_cases.splice(this.result_set_settings_data['index'], 1);
          this.statistic = new Statistic(this.result_sets_and_cases);
        });
        modal.close();
      }
    }
  }

  edit_result_set(form: NgForm, modal, valid: boolean) {
    if (!valid) {
      return;
    }
    this.ApiService.edit_case_by_result_set_id(this.result_set_settings_data['id'], form.value['result_set_name']).then(this_case => {
      const result_set_for_change = this.result_sets.filter(result_set => result_set.id === this.result_set_settings_data['id'])[0];
      result_set_for_change.name = this_case.name;
      result_set_for_change.updated_at = this_case.updated_at;
    });
    modal.close();
  }

  show_settings_button(index) {
    $('#' + index + '.result-set-setting-button').show();
  };

  hide_settings_button(index) {
    $('#' + index + '.result-set-setting-button').hide();
  };

  settings(modal, object, index, form) {
    this.result_set_settings_data = {object: object, id: object.id, index: index};
    modal.open();
    form.controls['result_set_name'].setValue(object.name);
  }

  set_space_width() {
    $('.product-space').removeClass('very-big-column big-column').addClass('small-column');
    $('.plan-space').removeClass('very-big-column big-column').addClass('small-column');
    $('.run-space').removeClass('very-big-column big-column').addClass('big-column');
    $('.result_set-space').removeClass('big-column').addClass('small-column');
    $('.lost-result').hide();
  }

  getStylesBackround(object) {
    if (this.statuses && object['status']) {
      return {'background': this.statuses[object['status']].color};
    }
  }

  selectCounter(result_set) {
    if (this.selected_counter.indexOf(result_set.id) === -1) {
      this.selected_counter.push(result_set.id);
    } else {
      const index = this.selected_counter.indexOf(result_set.id);
      this.selected_counter.splice(index, 1);
    }
    this.add_result_button(this.selected_counter.length === 0);
  }

  add_result_button(disable: boolean) {
    if (disable) {
      $('.add-result-block').addClass('disabled');
    } else {
      $('.add-result-block').removeClass('disabled');
    }
  }

  add_result_modal(modal) {
    if (this.selected_counter.length !== 0) {
      modal.open();
      if (this.selected_counter.length === 1) {
        this.set_sets_status_as_default();
      } else {
        this.set_first_status_as_default();
      }
    }
  }

  set_sets_status_as_default() {
    this.select_default_status(this.result_sets.find(set => set['id'] + '' === $('input[type=checkbox]:checked').val())['status']);
  }

  set_first_status_as_default() {
    this.Selector.clear_selected();
    this.selected_status_id = null;
  }

  add_results(form: NgForm, modal) {
    if (this.selected_status_id !== null) {
    this.ApiService.result_new(this.selected_counter, form.value['result_description'],
      this.statuses[this.selected_status_id]['name']).then(res => {
          this.result_sets_and_cases.filter(current_object => this.selected_counter.includes(current_object.id))
            .forEach((current_result_set, index) => {
              current_result_set.status = +this.selected_status_id;
          });
          this.statistic = new Statistic(this.result_sets_and_cases);
          this.Selector.clear_selected();
          this.selected_status_id = null;
          form.controls['result_description'].setValue(null);
    });
    modal.close();
    }
  }

  addfilter(value, self) {
    this.filer_selector(self);
    var index = this.filter.indexOf(value, 0);
    if (index === -1) {
      this.filter.push(value);
    } else {
      this.filter.splice(index, 1);
    }
  }

  filer_selector(element) {
    if ($(element).hasClass('selected')) {
      $(element).removeClass('selected');
    } else {
      $(element).addClass('selected');
    }
  }

  selected_status_get(selected_id) {
    this.selected_status_id = selected_id;
  }

  select_default_status(id) {
    this.Selector.set_status(id);
    this.selected_status_id = id;
  }

  get_result_sets_and_cases(run_id, product_id) {
    const cases = [];
    this.ApiService.get_cases_by_run_id(run_id, product_id).then(all_cases => {
      Object(all_cases ).forEach(current_case => {
        if (this.result_sets.filter(result_set => result_set.name === current_case.name).length === 0) {
          cases.push(new Case(current_case));
        }
      });
      this.result_sets_and_cases = this.result_sets.concat(cases);
      this.statistic = new Statistic(this.result_sets_and_cases);
    });
  }
}
