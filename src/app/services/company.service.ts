import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Constants } from '../constants';
import { CompanyDetails, Stock, StockAddVM, StockGetVM } from '../models/company.model';

@Injectable()
export class CompanyService {

  constructor(@Inject("gatewayAPIRoot") private GATEWAY_API_ROOT, private http: HttpClient) { }

  public getAllCompanies(): Observable<CompanyDetails[]> {
    let url = `${this.GATEWAY_API_ROOT}/${Constants.getAllCompaniesEndpoint}`;
    return this.http.get<CompanyDetails[]>(url).pipe(map(this.extractResult), catchError(this.handleError));
  }

  public getCompany(code: any): Observable<CompanyDetails> {
    let url = `${this.GATEWAY_API_ROOT}/${Constants.getCompanyEndpoint}/${code}`;
    return this.http.get<CompanyDetails>(url).pipe(map(this.extractResult), catchError(this.handleError));
  }

  public addCompany(company: CompanyDetails): Observable<CompanyDetails> {
    let url = `${this.GATEWAY_API_ROOT}/${Constants.addCompanyEndpoint}`;
    return this.http.post<CompanyDetails>(url, JSON.stringify(company)).pipe(map(this.extractResult), catchError(this.handleError));
  }

  public deleteCompany(code: any): Observable<CompanyDetails> {
    let url = `${this.GATEWAY_API_ROOT}/${Constants.deleteCompanyEndpoint}/${code}`;
    return this.http.delete<CompanyDetails>(url).pipe(map(this.extractResult), catchError(this.handleError));
  }

  public getCompanyStocks(input: StockGetVM): Observable<Stock[]> {
    let url = `${this.GATEWAY_API_ROOT}/${Constants.getCompanyStocksEndpoint}`;
    return this.http.post<Stock[]>(url, JSON.stringify(input)).pipe(map(this.extractResult), catchError(this.handleError));
  }

  public getAllCompanyStocks(): Observable<Stock[]> {
    let url = `${this.GATEWAY_API_ROOT}/${Constants.getAllCompanyStocksEndpoint}`;
    return this.http.get<Stock[]>(url).pipe(map(this.extractResult), catchError(this.handleError));
  }

  public addCompanyStock(stock: StockAddVM): Observable<Stock> {
    let url = `${this.GATEWAY_API_ROOT}/${Constants.addCompanyStocksEndpoint}`;
    return this.http.post<Stock>(url, JSON.stringify(stock)).pipe(map(this.extractResult), catchError(this.handleError));
  }

  public getCompanyStocksByCode(code: any): Observable<Stock[]> {
    let url = `${this.GATEWAY_API_ROOT}/${Constants.getCompanyStocksEndpoint}/${code}`;
    return this.http.get<Stock[]>(url).pipe(map(this.extractResult), catchError(this.handleError));
  }

  public deleteCompanyStocks(code: any): Observable<string> {
    let url = `${this.GATEWAY_API_ROOT}/${Constants.deleteCompanyStocksEndpoint}/${code}`;
    return this.http.delete<string>(url).pipe(map(this.extractResult), catchError(this.handleError));
  }

  private extractResult(result: any) {
    return result || {};
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent)
      console.error('An error occured', error.error.message);
    else
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    return throwError('Something bad happened; please try again.');
  }
}
