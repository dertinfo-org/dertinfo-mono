import { Component } from '@angular/core';

import { NavController } from '@ionic/angular';

@Component({
    selector: 'page-help',
    templateUrl: 'help.page.html',
    standalone: false
})
export class HelpPage {

  constructor(public navCtrl: NavController) {

  }

}
