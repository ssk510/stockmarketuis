import { AuditFields } from "./audit.model";

declare type stockExchange = 'BSE' | 'NSE' | '' | null | undefined;

export interface Stock {
    Id?: any;
    companyCode?: any;
    price?: any;
    date?: any;
    time?: any;
}

export interface CompanyDetails extends AuditFields {
    id?: any;
    code?: string,
    name?: string,
    ceo?: string,
    turnover?: number,
    website?: string,
    stockExchange?: string
}

export interface StockAddVM {
    companyCode?: string,
    price?: number,
    date?: Date,
    time?: Date
}

export interface StockGetVM {
    companyCode?: string,
    startDate?: Date,
    endDate?: Date
}