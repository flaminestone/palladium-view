import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {environment} from '../environments/environment';
import {AuthenticationService} from 'services/authentication.service';
@Injectable()

export class HttpService {

  constructor(private http: HttpClient, private authenticationService: AuthenticationService) {}

  /*endpoint for api server can be like http://192.168.0.1, without last slash.
   * if request is used api (need token) - part /api/ will be added to url */
  postData(path, params) {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization',  JSON.parse(localStorage.getItem('auth_data'))['token'] );
    return this.http.post(environment.host + '/api' + path, JSON.stringify(params), {headers: headers}).toPromise().catch(error => {
      if (error.status === 401 ) {
        console.error(error.message);
        this.authenticationService.logout();
      }
    });
  }
}
