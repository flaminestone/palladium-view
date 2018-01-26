import {Injectable} from '@angular/core';
import {HttpService} from './http-request.service';
import {AuthenticationService} from './authentication.service';
import {Router} from '@angular/router';
import {Suite} from '../app/models/suite';
import {Run} from '../app/models/run';
import {Product} from '../app/models/product';
import {Plan} from '../app/models/plan';
import {Case} from '../app/models/case';
import {ResultSet} from '../app/models/result_set';
import {Result} from '../app/models/result';
import {Statistic} from '../app/models/statistic';
import {History} from '../app/models/history_object';
import {Status} from '../app/models/status';
import {Invite} from '../app/models/invite';

@Injectable()
export class PalladiumApiService {
  suites: Suite[] = [];
  products: Product[] = [];
  plans: Plan[] = [];
  runs: Run[] = [];
  cases: Case[] = [];
  result_sets: ResultSet[] = [];
  results: Result[] = [];
  histories: History[] = [];

  constructor(private router: Router, private httpService: HttpService,
              private authenticationService: AuthenticationService) {
  }

  //#region Status
  get_statuses(): Promise<any> {
    return this.httpService.postData('/statuses', '').then((resp: any) => {
      const statuses = [];
      Object.keys(resp['statuses']).forEach(key => {
        statuses.push(new Status(resp['statuses'][key]));
      });
      statuses.push(new Status({name: 'Untested', color: '#ffffff', id: 0, 'blocked': true}));
      return statuses;
    });
  }

  get_not_blocked_statuses(): Promise<any> {
    return this.httpService.postData('/not_blocked_statuses', '').then((resp: any) => {
      const statuses = [];
      Object.keys(resp['statuses']).forEach(key => {
        statuses.push(new Status(resp['statuses'][key]));
      });
      return statuses;
    });
  }

  block_status(id): Promise<JSON> {
    return this.httpService.postData('/status_edit', {status_data: {id: id, block: true}}).then((resp: any) => {
      return resp['status'];
    });
  }

  update_status(id, name, color): Promise<any> {
    return this.httpService.postData('/status_edit', {
      status_data: {
        id: id,
        name: name,
        color: color
      }
    }).then((resp: any) => {
      return new Status(resp['status']);
    });
  }

  status_new(name, color) {
    return this.httpService.postData('/status_new', {status_data: {color: color, name: name}}).then((resp: any) => {
      return resp['status'];
    });
  }
  //#endregion

  //#region Token
  get_tokens(): Promise<any> {
    return this.httpService.postData('/tokens', '').then((resp: any) => {
      return resp['tokens'];
    }, (errors: any) => {
      this.authenticationService.logout();
      this.router.navigate(['/login']);
    });
  }

  create_token(name: string): Promise<JSON> {
    return this.httpService.postData('/token_new', {token_data: {name: name}}).then((resp: any) => {
      return resp;
    });
  }

  //#endregion

  //#region Suite
  get_suites(product_id): Promise<any> {
    return this.httpService.postData('/suites', {suite_data: {product_id: product_id}}).then((resp: any) => {
      this.suites = [];
      Object(resp['suites']).forEach(suite => {
        this.suites.push(new Suite(suite));
      });
      return this.suites;
    }, (errors: any) => {
    });
  }

  edit_suite_by_run_id(run_id, name): Promise<any> {
    const params = {suite_data: {run_id: run_id, name: name}};
    return this.httpService.postData('/suite_edit', params).then((resp: any) => {
      return new Suite(resp['suite']);
    }, (errors: any) => {
      console.log(errors);
    });
  }

  edit_suite(id, name): Promise<any> {
    return this.httpService.postData('/suite_edit', {suite_data: {name: name, id: id}}).then((resp: any) => {
      return new Suite(resp['suite']);
    }, (errors: any) => {
      console.log(errors);
    });
  }

  delete_suite(suite_id): Promise<any> {
    return this.httpService.postData('/suite_delete', {suite_data: {id: suite_id}}).then((resp: any) => {
      return new Suite(resp['suite']);
    }, (errors: any) => {
      console.log(errors);
    });
  }

  //#endregion

  //#region Cases
  get_cases(id): Promise<any> {
    return this.httpService.postData('/cases', {case_data: {suite_id: id}}).then((resp: any) => {
      this.cases = [];
      Object(resp['cases']).forEach(current_case => {
        this.cases.push(new Case(current_case));
      });
      return this.cases;
    }, (errors: any) => {
      console.log(errors);
    });
  }

  get_cases_by_run_id(run_id, product_id): Promise<any> {
    return this.httpService.postData('/cases', {
      case_data: {
        run_id: run_id,
        product_id: product_id
      }
    }).then((resp: any) => {
      this.cases = [];
      Object(resp['cases']).forEach(current_case => {
        this.cases.push(new Case(current_case));
      });
      return this.cases;
    }, (errors: any) => {
      console.log(errors);
    });
  }

  edit_case_by_result_set_id(result_set_id, name): Promise<any> {
    const params = {case_data: {result_set_id: result_set_id, name: name}};
    return this.httpService.postData('/case_edit', params).then((resp: any) => {
      console.log(resp);
      return new Case(resp['case']);
    }, (errors: any) => {
      console.log(errors);
    });
  }

  edit_case(case_id, name): Promise<any> {
    return this.httpService.postData('/case_edit', {case_data: {id: case_id, name: name}}).then((resp: any) => {
      return new Case(resp['case']);
    }, (errors: any) => {
      console.log(errors);
    });
  }

  delete_case(case_id): Promise<any> {
    return this.httpService.postData('/case_delete', {case_data: {id: case_id}}).then((resp: any) => {
      return new Case(resp['case']);
    }, (errors: any) => {
      console.log(errors);
    });
  }

  get_history(case_id): Promise<any> {
    this.histories = [];
    return this.httpService.postData('/case_history', {case_data: {id: case_id}}).then((resp: any) => {
      resp['history_data'].forEach(data => {
        if (data['statistic']) {
          data['statistic'] = new Statistic(data['statistic']);
        }
        this.histories.push(new History(data));
      });
      return this.histories;
    }, (errors: any) => {
      console.log(errors);
    });
  }

  //#endregion

  //#region Run
  get_runs(plan_id): Promise<any> {
    this.runs = [];
    return this.httpService.postData('/runs', {run_data: {plan_id: plan_id}})
      .then(
        (resp: any) => {
          Object(resp['runs']).forEach(run => {
            this.runs.push(new Run(run));
          });
          return this.runs;
        }, (errors: any) => {
          console.log(errors);
        });
  }

  create_run(run_name, plan_id): Promise<any> {
    return this.httpService.postData('/run_new', {run_data: {plan_id: plan_id, name: run_name}})
      .then(
        (resp: any) => {
          return new Run(resp['run']);
        }, (errors: any) => {
          console.log(errors);
        });
  }

  delete_run(run_id): Promise<any> {
    return this.httpService.postData('/run_delete', {run_data: {id: run_id}})
      .then(
        run => {
          return run['run'];
        },
        (errors: any) => {
          console.log(errors);
        });
  }

  //#endregion

  //#region Products
  get_products(): Promise<any> {
    this.products = [];
    return this.httpService.postData('/products', '')
      .then(
        (resp: any) => {
          Object(resp['products']).forEach(product => {
            this.products.push(new Product(product));
          });
          return this.products;
        }, (errors: any) => {
          console.log(errors);
        });
  }

  delete_product(id): Promise<any> {
    return this.httpService.postData('/product_delete', {product_data: {id: id}})
      .then(products => {
        return products;
      }, (errors: any) => {
        console.log(errors);
      });
  }

  edit_product(id, name): Promise<any> {
    return this.httpService.postData('/product_edit', {product_data: {name: name, id: id}})
      .then((products: any) => {
      const product = new Product(products['product_data']);
      product.errors = products['errors'];
        return (product);
      });
  }

  //#endregion

  //#region Plans
  get_plans(product_id): Promise<any> {
    this.plans = [];
    const params = {plan_data: {product_id: product_id}};
    return this.httpService.postData('/plans', params)
      .then(
        (resp: any) => {
          Object(resp['plans']).forEach(plan => {
            this.plans.push(new Plan(plan));
          });
          return this.plans;
        }, (errors: any) => {
          console.log(errors);
        });
  }

  edit_plan(id, name): Promise<any> {
    return this.httpService.postData('/plan_edit', {plan_data: {plan_name: name, id: id}})
      .then(
        (plan: any) => {
          return new Plan(plan['plan_data']);
        }, (errors: any) => {
          console.log(errors);
        });
  }

  delete_plan(id): Promise<any> {
    return this.httpService.postData('/plan_delete', {plan_data: {id: id}})
      .then(plan_data => {
        return plan_data['plan'];
      }, (errors: any) => {
        console.log(errors);
      });
  }

  //#endregion

  //#region Result Set
  get_result_sets(run_id): Promise<any> {
    this.result_sets = [];
    return this.httpService.postData('/result_sets', {result_set_data: {run_id: run_id}})
      .then(
        resp => {
          Object(resp['result_sets']).forEach(result_set => {
            this.result_sets.push(new ResultSet(result_set));
          });
          return this.result_sets;
        }, (errors: any) => {
          console.log(errors);
        });
  }

  delete_result_set(id): Promise<any> {
    return this.httpService.postData('/result_set_delete',
      {result_set_data: {id: id}})
      .then(result_set => {
          return result_set['result_set']['id'];
        },
        (errors: any) => {
          console.log(errors);
        });
  }

  //#endregion

  //#region Result
  get_results(result_set_id): Promise<any> {
    this.results = [];
    return this.httpService.postData('/results', {result_data: {result_set_id: result_set_id}})
      .then(
        resp => {
          Object(resp['results']).forEach(result => {
            this.results.push(new Result(result));
          });
          return this.results;
        }, error => console.log(error));
  }

  get_result(result_id): Promise<any> {
    return this.httpService.postData('/result', {result_data: {id: result_id}})
      .then(
        result => {
          return new Result(result['result']);
        }, error => console.log(error));
  }

  result_new(result_sets, description, status): Promise<any> {
    return this.httpService.postData('/result_new', {
      result_data: {
        message: description, status: status.name,
        result_set_id: result_sets.map(obj => obj.id)
      }
    })
      .then(res => {
        return [new Result(res['result']), res['other_data']];
      }, error => console.log(error));
  }

  result_new_by_case(cases, message, status, run_id): Promise<any> {
    const params = {result_set_data: {run_id: run_id, name: []}, result_data: {message: message, status: status.name}};
    for (const this_case of cases) {
      params.result_set_data.name.push(this_case.name);
    }
    return this.httpService.postData('/result_new', params).then(res => {
      const result_sets = [];
      res['other_data']['result_set_id'].forEach((result_set_id, index) => {
        const new_result_set = new ResultSet(cases[index]);
        new_result_set.run_id = run_id;
        new_result_set.status = status['id'];
        new_result_set.id = result_set_id;
        result_sets.push(new_result_set);
      });
      return result_sets;
    }, error => console.log(error));
  }

  //#endregion

  //#region Result
  generate_invite(): Promise<any> {
    return this.httpService.postData('/create_invite_token', {}).then(res => {
      return new Invite(res['invite_data']);
    }, error => console.log(error));
  }

  get_invite(): Promise<any> {
    return this.httpService.postData('/get_invite_token', {}).then(res => {
      if (res['invite_data']) {
        return new Invite(res['invite_data']);
      } else {
        return null;
      }
    }, error => console.log(error));
  }

  //#endregion
}
