import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SignIn } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent {

  signinForm: FormGroup;

  constructor(private fb: FormBuilder,
    private authService: AuthService, private router: Router) {

    this.signinForm = this.fb.group({
      'UserName': ['', Validators.compose([Validators.required, Validators.email])],
      'UserPassword': ['', Validators.required]
    });
  }

  onSubmit() {
    const val = this.signinForm.value;
    const user: SignIn = {
      email: val.UserName,
      password: val.UserPassword
    };

    this.authService.loginWithCognito(user).then((res: boolean) => {
      if (res) {
        console.log("SignIn Successfull");
        this.router.navigate(['home']);
      }
      else {
        console.log("SignIn UnSuccessfull");
      }
    }).catch((error: any) => {
      console.log("SignIn UnSuccessfull");
    });
  }

}
