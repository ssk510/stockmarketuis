import { Injectable } from '@angular/core';
import { ValidatorFn, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { from, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, take } from 'rxjs/operators';
import { CompanyService } from './company.service';

@Injectable({
    providedIn: 'root'
})
export class FormvalidationService {

    constructor(private companyService: CompanyService) { }

    patternValidator(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } => {
            if (!control.value) {
                return null;
            }
            const regex = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$');
            const valid = regex.test(control.value);
            return valid ? null : { invalidPassword: true };
        };
    }

    MatchPassword(password: string, confirmPassword: string) {
        return (formGroup: FormGroup) => {
            const passwordControl = formGroup.controls[password];
            const confirmPasswordControl = formGroup.controls[confirmPassword];

            if (!passwordControl || !confirmPasswordControl) {
                return null;
            }

            if (confirmPasswordControl.errors && !confirmPasswordControl.errors.passwordMismatch) {
                return null;
            }

            if (passwordControl.value !== confirmPasswordControl.value) {
                confirmPasswordControl.setErrors({ passwordMismatch: true });
            } else {
                confirmPasswordControl.setErrors(null);
            }
        }
    }

    userNameValidator(userControl: AbstractControl) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (this.validateUserName(userControl.value)) {
                    resolve({ userNameNotAvailable: true });
                } else {
                    resolve(null);
                }
            }, 1000);
        });
    }

    validateUserName(userName: string) {
        const UserList = ['ankit', 'admin', 'user', 'superuser'];
        return (UserList.indexOf(userName) > -1);
    }

    validateCompanyCode(): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors> | Promise<ValidationErrors> | null => {
            if (!control.value)
                return of(null);
            else {
                return control.valueChanges.pipe(
                    debounceTime(500),
                    take(1),
                    switchMap(_ =>
                        this.companyService.getCompany(control.value).pipe(
                            map(res => {
                                return res && Object.keys(res).length > 0 ? { companyNotAvailable: true } : null;
                            }))
                    )
                );
            };
        }
    }

    validateCompanyCodeService(companyCodes: string[], companyCode: string) {
        return (companyCodes.indexOf(companyCode) > -1);
    }

    companyTurnoverValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            let r = new RegExp(/^\d+$/);
            const v = +control.value;

            if (isNaN(v) || !r.test(v.toString()) || v <= 100000000) {
                return { 'gte': true, 'requiredValue': 1 }
            }

            return null;
        };
    }

    stockPriceValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const v = +control.value;

            let r = new RegExp(/^-?[0-9]\d*(\.\d+)$/);
            if (isNaN(v) || !r.test(v.toString())) {
                return { 'notvalid': true }
            }

            return null;
        };
    }
}