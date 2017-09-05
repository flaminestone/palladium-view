import {Injectable} from '@angular/core';
import {Headers, Http, Response, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import {environment} from '../environments/environment';

@Injectable()

export class HttpService {
  apiurl;

  constructor(private http: Http) {
  }

  /*endpoint for api server can be like http://192.168.0.1, without last slash.
   * if request is used api (need token) - part /api/ will be added to url */
  getData(path) {
    const headers = new Headers({'Authorization': JSON.parse(localStorage.getItem('auth_data'))['token']});
    return this.http.get(environment.host + '/api' + path, {headers: headers}).toPromise().then(param => {
      return Promise.resolve(this.extractData(param));
    }, param => {
      return Promise.reject(this.handleError(param));
    });
  }

  postData(path, params) {
    const headers = new Headers({
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': JSON.parse(localStorage.getItem('auth_data'))['token']
    });
    const options = new RequestOptions({headers: headers});

     return this.http.post(environment.host + '/api' + path, params, options).toPromise().then((param: any) => {
      return Promise.resolve(this.extractData(param));
    }, param => {
      return Promise.reject(this.handleError(param));
    });
  }

  private extractData(res: any) {
    const body = JSON.parse(res['_body']);
    return body || {};
  }

  private handleError(error:  any) {
    // In a real world app, you might use a remote logging infrastructure
    let errMsg: string;
    console.log(error);
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }
}
