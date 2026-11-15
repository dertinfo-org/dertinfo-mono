import { Component, OnInit } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { ILogger } from '../../providers/diagnostics/logger';
import { ConfigurationService } from 'src/app/services/configuration.service';

/*
  Generated class for the Data page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
    templateUrl: 'settings.page.html',
    standalone: false
})
export class SettingsPage implements OnInit {

    private _envionmentClickCounter = 0;

    public appPlatformIsCordova = '';
    public appPlatformIsAndroid = '';
    public appPlatformIsIos = '';
    public appName = '';
    public appPackageName = '';
    public appVersionType = '';

    public currentEnvionment = '';
    public modifyEnvironment = '';
    public isDeveloperMode = false;
    public tokenId = '';
    public refreshToken = '';
    public profile = '';
    public apiBaseUrl = '';
    public allowedDomains = '';

    constructor(
        private _logger: ILogger,
        private _platform: Platform,
        private _configurationService: ConfigurationService,
        public navCtrl: NavController

    ) {
        this._logger.trace('SettingsPage - constructor ', ['SettingsPage']);

    }

    public ngOnInit() {
        this._logger.trace('SettingsPage - ngOnInit ', ['SettingsPage']);

        this.getPlatformInfo();

        this.getPackageInfo();

        this.applyDataToModel();
    }

    public clearAllData()
    {
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('user_data');
    }

    // #####################################################################
    // # PRIVATE
    // #####################################################################

    private getPlatformInfo() {
        this.appPlatformIsCordova = this._platform.is('cordova') ? 'true' : 'false';
        this.appPlatformIsAndroid = this._platform.is('android') ? 'true' : 'false';
        this.appPlatformIsIos = this._platform.is('ios') ? 'true' : 'false';
    }

    private getPackageInfo() {
        this.appName = 'WEB-DertInfoJudgeMinders';
        this.appPackageName = 'uk.co.dertinfo.judgeminderapp';
        this.appVersionType = 'WEB';
    }

    private applyDataToModel() {
        this._logger.trace('SettingsPage - applyDataToModel ', ['SettingsPage']);

        this.isDeveloperMode = this._configurationService.baseApiUrl.indexOf('localhost') > -1;

        this.tokenId = localStorage.getItem('id_token');
        this.profile = localStorage.getItem('profile');
        this.refreshToken = localStorage.getItem('refresh_token');

        this.apiBaseUrl = this._configurationService.baseApiUrl;
        this.allowedDomains = this._configurationService.allowedDomains.join(', ');

    }

    // #####################################################################
    // # PRIVATE
    // #####################################################################
}
