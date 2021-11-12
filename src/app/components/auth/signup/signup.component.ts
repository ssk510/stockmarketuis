import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SignUp } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {

  signUpForm: FormGroup;

  constructor(private fb: FormBuilder,
    private authService: AuthService, private router: Router) {

    this.signUpForm = this.fb.group({
      'UserFName': ['', Validators.required],
      'UserLName': ['', Validators.required],
      'UserName': ['', Validators.compose([Validators.required, Validators.email])],
      'UserPassword': ['', Validators.required]
    });
  }

  onSubmit() {
    const val = this.signUpForm.value;
    const user: SignUp = {
      email: val.UserName,
      password: val.UserPassword,
      attributes: {
        given_name: val.UserFName,
        family_name: val.UserLName,
        email: val.UserName
      }
    };

    this.authService.registerWithCognito(user).then((res: boolean) => {
      if (res) {
        console.log("SignUp Successfull");
        this.router.navigate(['signin']);
      }
      else
        console.log("SignUp UnSuccessfull");
    }).catch((error: any) => {
      console.log("SignUp UnSuccessfull");
    });
  }

}
