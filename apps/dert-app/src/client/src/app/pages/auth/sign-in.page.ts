import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/authentication/auth.service';

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.page.html',
    styleUrls: ['./sign-in.page.scss'],
    standalone: false
})
export class SignInPage implements OnInit {

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authService.login();

    // this.signinForm = new FormGroup({
    //   username: new FormControl('', Validators.required),
    //   password: new FormControl('', Validators.required),
    //   rememberMe: new FormControl(false)
    // })
  }

  // signin() {
  //   const signinData = this.signinForm.value;

  //   this.submitButton.disabled = true;
  //   this.progressBar.mode = 'indeterminate';
  // }

}
