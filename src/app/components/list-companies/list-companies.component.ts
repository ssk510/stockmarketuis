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
  selector: 'app-list-companies',
  templateUrl: './list-companies.component.html',
  styleUrls: ['./list-companies.component.scss']
})
export class ListCompaniesComponent implements OnInit, AfterViewInit {

  @ViewChild('companyPagination', { static: true, read: MdbTablePaginationComponent }) mdbTablePagination: MdbTablePaginationComponent;
  @ViewChild('tableEl', { static: true, read: MdbTableDirective }) mdbTable: MdbTableDirective;
  @ViewChild('stockDetails', { static: true, read: ModalDirective }) viewStockDetModal: ModalDirective;
  @ViewChild('stockTablePgn', { static: false, read: MdbTablePaginationComponent }) stockTablePgn: MdbTablePaginationComponent;
  @ViewChild('stockTableEl', { static: false, read: MdbTableDirective }) stockTableEl: MdbTableDirective;
  @ViewChild('addCompany', { static: false, read: ModalDirective }) addCompanyModal: ModalDirective;
  @ViewChild('addStock', { static: false, read: ModalDirective }) addStockModal: ModalDirective;

  stockExchangeList: string[] = ['BSE', 'NSE'];
  companyList: Array<CompanyDetails> = [];
  stockDetailsList: Stock[] = [];
  previous: Array<CompanyDetails> = [];
  searchText: string = '';
  selectedCmpStkList: Stock[] = [];
  stockMin: any;
  stockMax: any;
  stockAvg: any;
  latestStockPrice: any;
  submitted: boolean = false;
  stockSubmitted: boolean = false;
  showAdditionalDetails: boolean = false;
  scrollY: boolean = true;
  addCompanyForm: FormGroup;
  addStockForm: FormGroup;
  fromDate = new FormControl(null, Validators.required);
  toDate = new FormControl(null, Validators.required);
  stockCmpSelect = new FormControl(null, Validators.required);
  selectedCompany: CompanyDetails = null;

  constructor(private cdRef: ChangeDetectorRef,
    private router: Router,
    private fb: FormBuilder,
    private formValidatorService: FormvalidationService,
    private companyService: CompanyService, private toastService: ToastService) {

  }
  ngAfterViewInit(): void {
    this.mdbTablePagination.setMaxVisibleItemsNumberTo(5);
    this.mdbTablePagination.calculateFirstItemIndex();
    this.mdbTablePagination.calculateLastItemIndex();
    this.cdRef.detectChanges();
  }

  ngOnInit(): void {
    this.createFormsAndEvents();
    this.companyService.getAllCompanies().subscribe((companies: CompanyDetails[]) => {
      this.companyList = companies || [];
      this.mdbTable.setDataSource(this.companyList);
      this.companyList = this.mdbTable.getDataSource();
      this.previous = this.mdbTable.getDataSource();
    });
  }

  private createFormsAndEvents() {

    this.addCompanyForm = this.fb.group({
      companyCode: new FormControl(null, { validators: Validators.compose([Validators.required, Validators.maxLength(20)]), asyncValidators: [this.formValidatorService.validateCompanyCode()], updateOn: 'blur' }),
      companyName: new FormControl(null, { validators: Validators.compose([Validators.required, Validators.maxLength(100)]) }),
      companyCEO: new FormControl(null, { validators: Validators.compose([Validators.required, Validators.maxLength(100)]) }),
      companyTurnover: new FormControl(null, { validators: Validators.compose([Validators.required, this.formValidatorService.companyTurnoverValidator()]) }),
      companyWebsite: new FormControl(null, { validators: Validators.compose([Validators.required, Validators.maxLength(100)]) }),
      companyStockExchange: new FormControl(null, { validators: Validators.compose([Validators.required, Validators.maxLength(50)]) })
    });

    this.addStockForm = this.fb.group({
      company: new FormControl(null, Validators.required),
      price: new FormControl(null, { validators: Validators.compose([Validators.required, this.formValidatorService.stockPriceValidator()]) }),
      date: new FormControl(null),
      time: new FormControl(null)
    });

    this.stockCmpSelect.valueChanges.pipe(debounceTime(2000), switchMap((code: any) => {
      return of(code);
    })).subscribe((code: any) => {
      if (code) {
        let company = this.companyList.find(x => x.code == code);
        if (company) {
          this.companyService.getCompanyStocksByCode(code).subscribe((stks: Stock[]) => {
            this.showAdditionalDetails = true;
            let stocks = _.orderBy(stks || [], ['date', 'time'], ['desc', 'desc']);
            this.stockTableEl.setDataSource(stocks);
            this.selectedCmpStkList = this.stockTableEl.getDataSource();
            this.stockMin = _.minBy(this.selectedCmpStkList, (o) => { return o.price });
            this.stockMax = _.maxBy(this.selectedCmpStkList, (o) => { return o.price });
            this.stockAvg = _.meanBy(this.selectedCmpStkList, (o) => { return o.price });
            this.latestStockPrice = stocks ? _.first(_.orderBy(stocks, ['date', 'time'], ['desc', 'desc'])) : 0;
          });
        }
        else {
          this.stockTableEl.setDataSource([]);
          this.selectedCmpStkList = this.stockTableEl.getDataSource();
          this.stockMin = 0;
          this.stockMax = 0;
          this.stockAvg = 0;
          this.latestStockPrice = 0;
          this.cdRef.detectChanges();
        }
      }
    });

    let filter$ = combineLatest([this.fromDate.valueChanges, this.toDate.valueChanges])
      .pipe(debounceTime(500), switchMap(([from, to]) => { return of({ fromDate: from, toDate: to }) }));

    filter$.subscribe((val: any) => {
      if (val?.fromDate && val?.toDate) {
        let stocklist: Stock[] = [];
        if (this.stockCmpSelect.value || this.selectedCompany) {
          let code = this.stockCmpSelect.value || this.selectedCompany.code;
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

  private resetStockGrid() {
    this.stockTableEl.setDataSource([]);
    this.selectedCmpStkList = this.stockTableEl.getDataSource();
    this.stockMin = 0;
    this.stockMax = 0;
    this.stockAvg = 0;
    this.latestStockPrice = 0;
  }

  private filterStocks(stocklist: Stock[], fromDate: any, toDate: any) {
    let filteredStocks = stocklist.filter(x => moment(x.date).local().isSameOrAfter(moment(fromDate), 'date') && moment(x.date).local().isSameOrBefore(moment(toDate), 'date'));
    if (filteredStocks && filteredStocks.length > 0) {
      filteredStocks = _.orderBy(filteredStocks, ['date', 'time'], ['desc', 'desc']);
      this.stockTableEl.setDataSource(filteredStocks);
      this.selectedCmpStkList = this.stockTableEl.getDataSource();
      this.stockMin = _.minBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockMax = _.maxBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockAvg = _.meanBy(this.selectedCmpStkList, (o) => { return o.price });
      this.latestStockPrice = filteredStocks ? _.first(_.orderBy(filteredStocks, ['date', 'time'], ['desc', 'desc'])) : 0;
      this.cdRef.detectChanges();
    }
    else {
      this.stockTableEl.setDataSource([]);
      this.selectedCmpStkList = this.stockTableEl.getDataSource();
      this.stockMin = 0;
      this.stockMax = 0;
      this.stockAvg = 0;
      this.latestStockPrice = 0
      this.cdRef.detectChanges();
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

  get addCompanyFormControl() {
    return this.addCompanyForm.controls;
  }

  get addStockFormControl() {
    return this.addStockForm.controls;
  }

  // getLatestStockPriceOfCompany(company: CompanyDetails) {
  //   return company?.stockDetails?.length > 0 ? _.first(_.orderBy(company.stockDetails, ['date', 'time'], ['desc', 'desc']))?.price : 0;
  // }

  addStockDetail(company: CompanyDetails) {
    this.addStockModal.show();
    this.addStockForm.reset();
    this.addStockForm.get('company').patchValue(company);
    this.addStockForm.get('company').updateValueAndValidity();
    this.addStockForm.get('date').patchValue(moment().utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }));
    //this.addStockForm.get('date').patchValue(moment().toDate());
    this.addStockForm.get('date').updateValueAndValidity();
    //this.addStockForm.get('time').patchValue(moment().utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }));
    this.addStockForm.get('time').patchValue(moment().toDate());
    this.addStockForm.get('time').updateValueAndValidity();
    this.addStockForm.updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  stockReset() {
    this.addStockForm.get('price').reset(null);
    this.addStockForm.get('price').updateValueAndValidity();
    this.addStockForm.get('date').reset(moment().utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate());
    //this.addStockForm.get('date').reset(moment().toDate());
    this.addStockForm.get('date').updateValueAndValidity();
    //this.addStockForm.get('time').reset(moment().utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }));
    this.addStockForm.get('time').reset(moment().toDate());
    this.addStockForm.get('time').updateValueAndValidity();
    //this.addStockForm.updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  onSubmit() {
    this.submitted = true;

    if (this.addCompanyForm.valid) {
      const compDet: CompanyDetails = {
        name: this.addCompanyForm.value.companyName,
        code: this.addCompanyForm.value.companyCode,
        ceo: this.addCompanyForm.value.companyCEO,
        turnover: parseFloat(this.addCompanyForm.value.companyTurnover),
        website: this.addCompanyForm.value.companyWebsite,
        stockExchange: this.addCompanyForm.value.companyStockExchange
      };
      this.companyService.addCompany(compDet).subscribe((res: CompanyDetails) => {
        if (res) {
          this.toastService.toastNotification('Company', `${compDet.name} added successfully!`);
        }
        this.addCompanyForm.reset();
        this.addCompanyModal.hide();
        this.cdRef.detectChanges();
        this.reloadCurrentRoute();
      });
    }
    return;
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
        }
        this.addStockForm.reset();
        this.addStockModal.hide();
        this.cdRef.detectChanges();
        this.reloadCurrentRoute();
      });
    }
  }

  private reloadCurrentRoute() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  showAll() {
    this.stockCmpSelect.reset(null, { emitEvent: true });
    this.fromDate.reset(null, { emitEvent: true });
    this.toDate.reset(null, { emitEvent: true });
    this.showAdditionalDetails = false;
    this.resetStockGrid();
    this.companyService.getAllCompanyStocks().subscribe((stks: Stock[]) => {
      let stocklistAll = _.orderBy(stks || [], ['companyName', 'date', 'time'], ['asc', 'desc', 'desc']);
      this.stockTableEl.setDataSource(stocklistAll);
      this.selectedCmpStkList = this.stockTableEl.getDataSource();
      this.stockMin = _.minBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockMax = _.maxBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockAvg = _.meanBy(this.selectedCmpStkList, (o) => { return o.price });
      this.cdRef.detectChanges();
    });
  }

  showCompanyAll() {
    this.fromDate.reset(null, { emitEvent: true });
    this.toDate.reset(null, { emitEvent: true });
    this.showAdditionalDetails = true;
    this.resetStockGrid();
    this.companyService.getCompanyStocksByCode(this.selectedCompany.code).subscribe((stks: Stock[]) => {
      let stocklistAll = _.orderBy(stks, ['companyName', 'date', 'time'], ['asc', 'desc', 'desc']);
      this.stockTableEl.setDataSource(stocklistAll);
      this.selectedCmpStkList = this.stockTableEl.getDataSource();
      this.stockMin = _.minBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockMax = _.maxBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockAvg = _.meanBy(this.selectedCmpStkList, (o) => { return o.price });
      this.cdRef.detectChanges();
    });
  }


  viewStockDetails() {
    this.selectedCompany = null;
    this.viewStockDetModal.show();
    this.cdRef.detectChanges();
    this.resetStockGrid();
    this.companyService.getAllCompanyStocks().subscribe((stocks: Stock[]) => {
      this.stockTableEl.setDataSource(stocks || []);
      this.selectedCmpStkList = this.stockTableEl.getDataSource();
      this.stockMin = _.minBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockMax = _.maxBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockAvg = _.meanBy(this.selectedCmpStkList, (o) => { return o.price });
      this.stockTablePgn.setMaxVisibleItemsNumberTo(5);
      this.stockTablePgn.calculateFirstItemIndex();
      this.stockTablePgn.calculateLastItemIndex();
      this.cdRef.detectChanges();
    });
  }

  viewCompanyStockDetails(company: CompanyDetails) {
    this.showAdditionalDetails = true;
    this.viewStockDetModal.show();
    this.resetStockGrid();
    this.cdRef.detectChanges();
    this.selectedCompany = this.companyList.find(x => x.id == company.id);
    if (this.selectedCompany) {
      this.companyService.getCompanyStocksByCode(this.selectedCompany.code).subscribe((stocks: Stock[]) => {
        this.selectedCmpStkList = stocks || [];
        this.stockTableEl.setDataSource(this.selectedCmpStkList);
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

  add() {
    this.addCompanyForm.reset();
    this.addCompanyModal.show();
  }

  getcompanyName(code: any): any {
    return this.companyList.find(c => c.code == code)?.name || '';
  }

  searchItems() {
    const prev = this.mdbTable.getDataSource();
    if (!this.searchText) {
      this.mdbTable.setDataSource(this.previous);
      this.companyList = this.mdbTable.getDataSource();
    }
    if (this.searchText) {
      this.companyList = this.mdbTable.searchLocalDataBy(this.searchText);
      this.mdbTable.setDataSource(prev);
    }
  }

}
