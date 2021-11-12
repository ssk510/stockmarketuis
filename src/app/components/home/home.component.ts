import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MdbTableDirective, MdbTablePaginationComponent, ModalDirective } from 'angular-bootstrap-md';
import * as moment from 'moment';
import * as _ from 'lodash';
import { combineLatest, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CompanyDetails, Stock, StockAddVM } from 'src/app/models/company.model';
import { FormvalidationService } from 'src/app/services/validators.service';
import { CompanyService } from 'src/app/services/company.service';
import { ToastService } from 'src/app/services/toast.service';
import { IConfirmBoxPublicResponse } from '@costlydeveloper/ngx-awesome-popup';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {

  @ViewChild('tableEl', { static: false, read: MdbTableDirective }) mdbTable: MdbTableDirective;
  @ViewChild('stockDetails', { static: false, read: ModalDirective }) viewStockDetModal: ModalDirective;
  @ViewChild('stockTablePgn', { static: false, read: MdbTablePaginationComponent }) stockTablePgn: MdbTablePaginationComponent;
  @ViewChild('stockTableEl', { static: false, read: MdbTableDirective }) stockTableEl: MdbTableDirective;
  @ViewChild('addStock', { static: false, read: ModalDirective }) addStockModal: ModalDirective;

  stockExchangeList: string[] = ['BSE', 'NSE'];
  companyList: Array<CompanyDetails> = [];
  stockDetails: Stock[] = [];
  previous: Array<CompanyDetails> = [];
  searchText = new FormControl(null, Validators.required);
  selectedCmpStkList: Stock[] = [];
  stockMin: any;
  stockMax: any;
  stockAvg: any;
  latestStockPrice: any;
  stockSubmitted: boolean = false;
  scrollY: boolean = true;
  addStockForm: FormGroup;
  fromDate = new FormControl(null, Validators.required);
  toDate = new FormControl(null, Validators.required);
  selectedCompany: CompanyDetails[] = [];

  constructor(private cdRef: ChangeDetectorRef,
    private router: Router,
    private fb: FormBuilder,
    private formValidatorService: FormvalidationService,
    private companyService: CompanyService, private toastService: ToastService) {

  }
  ngAfterViewInit(): void {
    this.mdbTable.setDataSource([]);
    this.cdRef.detectChanges();
  }

  ngOnInit(): void {
    this.createFormsAndEvents();

    this.companyService.getAllCompanies().subscribe((res: CompanyDetails[]) => {
      this.companyList = res || [];
    });
  }

  private createFormsAndEvents() {

    this.addStockForm = this.fb.group({
      company: new FormControl(null, Validators.required),
      price: new FormControl(null, { validators: Validators.compose([Validators.required, this.formValidatorService.stockPriceValidator()]) }),
      date: new FormControl(null),
      time: new FormControl(null)
    });

    let filter$ = combineLatest([this.fromDate.valueChanges, this.toDate.valueChanges])
      .pipe(debounceTime(500), switchMap(([from, to]) => { return of({ fromDate: from, toDate: to }) }));

    filter$.subscribe((val: any) => {
      if (val?.fromDate && val?.toDate) {
        let stocklist: Stock[] = [];
        if (this.selectedCompany) {
          let code = this.selectedCompany[0].code;
          this.companyService.getCompanyStocksByCode(code).subscribe((stks: Stock[]) => {
            stocklist = stks || [];
            this.filterStocks(stocklist, val.fromDate, val.toDate);
          });
        }
        else {
          this.companyService.getAllCompanyStocks().subscribe((stks: Stock[]) => {
            stocklist = stks || [];
            this.filterStocks(stocklist, val.fromDate, val.toDate);
          });
        }
      }
    });
  }

  private filterStocks(stocklist: Stock[], fromDate: any, toDate: any) {
    let filteredStocks = stocklist.filter(x => moment(x.date).isSameOrAfter(moment(fromDate), 'date') && moment(x.date).isSameOrBefore(moment(toDate), 'date'));
    if (filteredStocks && filteredStocks.length > 0) {
      filteredStocks = _.orderBy(filteredStocks, ['date', 'time'], ['desc', 'desc']);
      this.stockTableEl.setDataSource(filteredStocks);
      this.selectedCmpStkList = this.stockTableEl.getDataSource();
      this.stockMin = _.minBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockMax = _.maxBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockAvg = _.meanBy(this.selectedCmpStkList, (o) => { return o.price });
      this.cdRef.detectChanges();
    }
    else {
      this.stockTableEl.setDataSource([]);
      this.selectedCmpStkList = this.stockTableEl.getDataSource();
      this.stockMin = 0;
      this.stockMax = 0;
      this.stockAvg = 0;
      this.cdRef.detectChanges();
    }
  }

  searchCompany() {
    let company = this.companyList.find(x => x.code == this.searchText.value);
    if (company) {
      this.selectedCompany = [company];
      this.mdbTable.setDataSource([this.selectedCompany]);
      this.cdRef.detectChanges();
    }
    else {
      this.selectedCompany = [];
    }
  }

  getFormattedNaN(val: any) {
    return isNaN(val) ? 0 : val;
  }

  getFormattedDate(val: any): any {
    return moment(val).format('MMMM Do YYYY');
  }

  getFormattedTime(val: any): any {
    return moment(val).format('h:mm:ss:SSS a');
  }

  get addStockFormControl() {
    return this.addStockForm.controls;
  }

  // getLatestStockPriceOfCompany(company: Company) {
  //   return company?.stockDetails ? _.first(_.orderBy(company.stockDetails, ['date', 'time'], ['desc', 'desc']))?.price : 0;
  // }

  addStockDetail(company: CompanyDetails) {
    this.addStockModal.show();
    this.addStockForm.reset();
    this.addStockForm.get('company').patchValue(company);
    this.addStockForm.get('company').updateValueAndValidity();
    this.addStockForm.get('date').patchValue(moment().utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }));
    this.addStockForm.get('date').updateValueAndValidity();
    //this.addStockForm.get('time').patchValue(moment().utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }))
    this.addStockForm.get('time').patchValue(moment().toDate());
    this.addStockForm.get('time').updateValueAndValidity();
    this.addStockForm.updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  stockReset() {
    this.addStockForm.get('price').reset(null);
    this.addStockForm.get('price').updateValueAndValidity();
    this.addStockForm.get('date').reset(moment().utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }));
    //this.addStockForm.get('date').reset(moment().toDate());
    this.addStockForm.get('date').updateValueAndValidity();
    //this.addStockForm.get('time').reset(moment().utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }));
    this.addStockForm.get('time').reset(moment().toDate());
    this.addStockForm.get('time').updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  onStockSubmit() {
    this.stockSubmitted = true;
    if (this.addStockForm.valid) {
      const ip: StockAddVM = {
        companyCode: this.addStockForm.get('company').value?.code,
        price: parseFloat(this.addStockForm.get('price').value),
        date: this.addStockForm.get('date').value,
        time: this.addStockForm.get('time').value
      };
      this.companyService.addCompanyStock(ip).subscribe((stock: Stock) => {
        if (stock) {
          this.toastService.toastNotification('Stock', `Stock added to ${this.addStockForm.get('company').value?.name} successfully!`);
          this.addStockForm.reset();
          this.addStockModal.hide();
          this.reloadCurrentRoute();
        }
      });
    }
  }

  showCompanyAll() {
    this.fromDate.reset(null, { emitEvent: true });
    this.toDate.reset(null, { emitEvent: true });
    this.companyService.getCompanyStocksByCode(this.selectedCompany[0].code).subscribe((stks: Stock[]) => {
      let stocklistAll = _.orderBy(stks, ['companyName', 'date', 'time'], ['asc', 'desc', 'desc']);
      this.stockTableEl.setDataSource(stocklistAll);
      this.selectedCmpStkList = this.stockTableEl.getDataSource();
      this.stockMin = _.minBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockMax = _.maxBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockAvg = _.meanBy(this.selectedCmpStkList, (o) => { return o.price });
      this.cdRef.detectChanges();
    });
  }


  viewCompanyStockDetails(company: CompanyDetails) {
    this.viewStockDetModal.show();
    this.resetStockGrid();
    this.cdRef.detectChanges();
    let cmp = this.companyList.find(x => x.id == company.id);
    this.selectedCompany = cmp != null ? [cmp] : [];
    if (this.selectedCompany) {
      this.companyService.getCompanyStocksByCode(this.selectedCompany[0].code).subscribe((stocks: Stock[]) => {
        this.stockTableEl.setDataSource(stocks || []);
        this.selectedCmpStkList = this.stockTableEl.getDataSource();
        this.stockMin = _.minBy(this.selectedCmpStkList, (o) => { return o.price });
        this.stockMax = _.maxBy(this.selectedCmpStkList, (o) => { return o.price });
        this.stockAvg = _.meanBy(this.selectedCmpStkList, (o) => { return o.price });
        this.latestStockPrice = stocks ? _.first(_.orderBy(stocks, ['date', 'time'], ['desc', 'desc'])) : 0;
        this.stockTablePgn.setMaxVisibleItemsNumberTo(5);
        this.stockTablePgn.calculateFirstItemIndex();
        this.stockTablePgn.calculateLastItemIndex();
        this.cdRef.detectChanges();
      });
    }
  }

  private resetStockGrid() {
    this.stockTableEl.setDataSource([]);
    this.selectedCmpStkList = this.stockTableEl.getDataSource();
    this.stockMin = 0;
    this.stockMax = 0;
    this.stockAvg = 0;
    this.latestStockPrice = 0;
  }
  remove(company: CompanyDetails) {
    this.toastService.openConfirmPopup('Are you sure?', `That action will delete ${company.name} and its stock details!`).subscribe((resp: IConfirmBoxPublicResponse) => {
      if (resp.ClickedButtonID == 'yes') {
        this.companyService.deleteCompanyStocks(company.code).subscribe((result: string) => {
          if (result) {
            this.companyService.deleteCompany(company.code).subscribe((res: any) => {
              if (res) {
                this.toastService.toastNotification('Success', `${company.name} details deleted successfully!`);
                this.reloadCurrentRoute();
              }
            });
          }
        });
      }
    });
  }

  private reloadCurrentRoute() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

}
