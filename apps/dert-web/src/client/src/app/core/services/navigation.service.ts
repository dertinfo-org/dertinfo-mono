import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { EventDto } from 'app/models/dto';
import { GroupDto } from 'app/models/dto';
import { EventListCache } from 'app/modules/repositories/cache/eventlist.cache';
import { GroupListCache } from 'app/modules/repositories/cache/grouplist.cache';
import { AuthService } from '../authentication/auth.service';

interface IMenuItem {
  type: string;       // Possible values: link/dropDown/icon/separator/extLink
  name?: string;      // Used as display text for item and title for separator type
  state?: string;     // Router state
  icon?: string;      // Item icon name
  tooltip?: string;   // Tooltip text
  disabled?: boolean; // If true, item will not be appeared in sidenav.
  sub?: IChildItem[];  // Dropdown items
}
interface IChildItem {
  name: string;       // Display text
  state: string;       // Router state
  redirect: string;
}

@Injectable()
export class NavigationService {

  private groupsForUser: GroupDto[] = [];
  private eventsForUser: EventDto[] = [];

  separatorMenu: IMenuItem[] = [
    {
      type: 'separator',
      name: 'Info'
    },
    {
      name: 'DASHBOARD',
      type: 'link',
      tooltip: 'Dashboard',
      icon: 'dashboard',
      state: 'dashboard'
    },
    {
      name: 'GROUPS',
      type: 'dropDown',
      tooltip: 'Dialogs',
      icon: 'group_work',
      state: 'group-view',
      sub: []
    },
    {
      name: 'EVENTS',
      type: 'dropDown',
      tooltip: 'Dialogs',
      icon: 'event',
      state: 'event',
      sub: []
    },
    {
      type: 'separator',
      name: 'Account'
    },
    {
      name: 'USERACCOUNT',
      type: 'link',
      tooltip: 'User Account',
      icon: 'account_circle',
      state: 'user-account',
      sub: []
    },
    {
      name: 'DERTOFDERTSADMIN',
      type: 'link',
      tooltip: 'Dert of Derts',
      icon: 'view_quilt',
      state: 'dodadmin',
      sub: []
    },
    {
      name: 'SYSTEMADMIN',
      type: 'link',
      tooltip: 'SystemAdmin',
      icon: 'admin_panel_settings',
      state: 'systemadmin',
      sub: []
    },
  ];

  // Icon menu TITLE at the very top of navigation.
  // This title will appear if any icon type item is present in menu.
  iconTypeMenuTitle = 'Frequently Accessed';
  // sets iconMenu as default;
  menuItems = new BehaviorSubject<IMenuItem[]>(this.separatorMenu);
  // navigation component has subscribed to this Observable
  menuItems$ = this.menuItems.asObservable();

  constructor(
    private groupListCache: GroupListCache,
    private eventlistCache: EventListCache,
    private authService: AuthService
  ) {
    this.loadGroupsForUser();
    this.loadEventsForUser();
    this.applyDertOfDertsForUserToMenu();
    this.applySystemAdminForUserToMenu();
  }

  public addGroupForUser(groupDto: GroupDto) {
    const group = this.groupsForUser.find(g => g.id === groupDto.id);

    if (!group) {
      this.groupsForUser.push(groupDto);
      this.applyGroupsForUserToMenu();
      this.publishNavigationChange('separator-menu');
    }
  }

  public addEventForUser(eventDto: EventDto) {
    const myEvent = this.eventsForUser.find(e => e.id === eventDto.id);

    if (!myEvent) {
      this.eventsForUser.push(eventDto);
      this.applyEventsForUserToMenu();
      this.publishNavigationChange('separator-menu');
    }
  }

  public removeGroupForUser(groupDto: GroupDto) {
    const filteredGroups = this.groupsForUser.filter(g => g.id !== groupDto.id);

    if (filteredGroups.length !== this.groupsForUser.length) {
      this.groupsForUser = filteredGroups;
      this.applyGroupsForUserToMenu();
      this.publishNavigationChange('separator-menu');
    }
  }

  public removeEventForUser(eventDto: EventDto) {
    const filteredEvents = this.eventsForUser.filter(e => e.id !== eventDto.id);

    if (filteredEvents.length !== this.groupsForUser.length) {
      this.eventsForUser = filteredEvents;
      this.applyEventsForUserToMenu();
      this.publishNavigationChange('separator-menu');
    }
  }

  public updateGroupNameForUser(groupId: number, groupName: string) {
    const group = this.groupsForUser.find(g => g.id === groupId);

    if (group) {
      group.groupName = groupName;
      this.applyGroupsForUserToMenu();
      this.publishNavigationChange('separator-menu');
    }
  }

  public updateEventNameForUser(eventId: number, eventName: string) {
    const myEvent = this.eventsForUser.find(e => e.id === eventId);

    if (myEvent) {
      myEvent.name = eventName;
      this.applyEventsForUserToMenu();
      this.publishNavigationChange('separator-menu');
    }
  }

  public markEventConfiguredForUser(eventId: number) {
    const myEvent = this.eventsForUser.find(e => e.id === eventId);

    if (myEvent) {
      myEvent.isConfigured = true;
      this.applyEventsForUserToMenu();
      this.publishNavigationChange('separator-menu');
    }
  }

  public markGroupConfiguredForUser(groupId: number) {
    const myGroup = this.groupsForUser.find(e => e.id === groupId);

    if (myGroup) {
      myGroup.isConfigured = true;
      this.applyGroupsForUserToMenu();
      this.publishNavigationChange('separator-menu');
    }
  }

  // Customizer component uses this method to change menu.
  // You can remove this method and customizer component.
  // Or you can customize this method to supply different menu for
  // different user type.
  public publishNavigationChange(menuType: string) {
    switch (menuType) {
      case 'separator-menu':
        this.menuItems.next(this.separatorMenu);
        break;
      // case 'icon-menu':
      //   this.menuItems.next(this.iconMenu);
      //   break;
      // default:
      //   this.menuItems.next(this.defaultMenu);
    }
  }

  private loadGroupsForUser() {
    this.groupListCache.list().subscribe(
      data => {
        // Copy the cached list. The dashboard keeps that array, and both sides append a new group.
        this.groupsForUser = [...(data || [])];
        this.applyGroupsForUserToMenu();
      },
      error => {
        console.error('ERROR: NavigationService - loadGroupsForUser');
      }
    );
  }

  private loadEventsForUser() {
    this.eventlistCache.list().subscribe(
      data => {
        // Copy the cached list. The dashboard keeps that array, and both sides append a new event.
        this.eventsForUser = [...(data || [])];
        this.applyEventsForUserToMenu();
      },
      error => {
        console.error('ERROR: NavigationService - loadEventsForUser');
      }
    );
  }

  private applyGroupsForUserToMenu() {
    const groupsMenuItem = this.separatorMenu.find(mi => mi.name === 'GROUPS');
    if (groupsMenuItem) {
      if (this.groupsForUser && this.groupsForUser.length > 0) {
        this.groupsForUser.sort((a, b) => { return a.groupName > b.groupName ? 1 : -1; });

        groupsMenuItem.sub = this.groupsForUser.map(g => {

          const childItem: IChildItem = {
            name: g.groupName,
            state: g.groupName + '/' + g.id.toString(),
            redirect: null
          };

          if (!g.isConfigured) {
            childItem.redirect = '/group-configure/' + encodeURIComponent(g.groupName) + '/' + g.id + '/start';
          }

          return childItem;
        });

      } else {
        // Hide the groups menu item
        groupsMenuItem.disabled = true;
      }
    }
  }

  private applyEventsForUserToMenu() {
    const eventsMenuItem = this.separatorMenu.find(mi => mi.name === 'EVENTS');
    if (eventsMenuItem) {
      if (this.eventsForUser && this.eventsForUser.length > 0) {
        this.eventsForUser.sort((a, b) => { return a.name > b.name ? 1 : -1; });

        eventsMenuItem.sub = this.eventsForUser.map(e => {

          const childItem: IChildItem = {
            name: e.name,
            state: e.name + '/' + e.id.toString(),
            redirect: null
          };

          if (!e.isConfigured) {
            childItem.redirect = '/event-configure/' + encodeURIComponent(e.name) + '/' + e.id + '/start';
          }

          return childItem;
        });
      } else {
        // Hide the groups menu item
        eventsMenuItem.disabled = true;
      }
    }
  }

  private applyDertOfDertsForUserToMenu() {
    const dertOfDertsMenuItem = this.separatorMenu.find(mi => mi.name === 'DERTOFDERTSADMIN');

    if (!this.authService.userData().dertOfDertsAdmin) {
      dertOfDertsMenuItem.disabled = true;
    }

  }

  private applySystemAdminForUserToMenu() {
    const systemAdminMenuItem = this.separatorMenu.find(mi => mi.name === 'SYSTEMADMIN');

    if (!this.authService.userData().superAdmin) {
      systemAdminMenuItem.disabled = true;
    }

  }

  // defaultMenu: IMenuItem[] = [
  //   {
  //     name: 'DASHBOARD',
  //     type: 'link',
  //     tooltip: 'Dashboard',
  //     icon: 'dashboard',
  //     state: 'dashboard'
  //   },
  //   {
  //     name: 'INBOX',
  //     type: 'link',
  //     tooltip: 'Inbox',
  //     icon: 'inbox',
  //     state: 'inbox'
  //   },
  //   {
  //     name: 'CHAT',
  //     type: 'link',
  //     tooltip: 'Chat',
  //     icon: 'chat',
  //     state: 'chat'
  //   },
  //   {
  //     name: 'CALENDAR',
  //     type: 'link',
  //     tooltip: 'Calendar',
  //     icon: 'date_range',
  //     state: 'calendar'
  //   },
  //   {
  //     name: 'DIALOGS',
  //     type: 'dropDown',
  //     tooltip: 'Dialogs',
  //     icon: 'filter_none',
  //     state: 'dialogs',
  //     sub: [
  //       { name: 'CONFIRM', state: 'confirm' },
  //       { name: 'LOADER', state: 'loader' },
  //     ]
  //   },
  //   {
  //     name: 'MATERIAL',
  //     type: 'dropDown',
  //     tooltip: 'Material',
  //     icon: 'favorite',
  //     state: 'material',
  //     sub: [
  //       { name: 'BUTTONS', state: 'buttons' },
  //       { name: 'CARDS', state: 'cards' },
  //       { name: 'GRIDS', state: 'grids' },
  //       { name: 'LISTS', state: 'lists' },
  //       { name: 'MENU', state: 'menu' },
  //       { name: 'TABS', state: 'tabs' },
  //       { name: 'SELECT', state: 'select' },
  //       { name: 'RADIO', state: 'radio' },
  //       { name: 'AUTOCOMPLETE', state: 'autocomplete' },
  //       { name: 'SLIDER', state: 'slider' },
  //       { name: 'PROGRESS', state: 'progress' },
  //       { name: 'SNACKBAR', state: 'snackbar' },
  //     ]
  //   },
  //   {
  //     name: 'FORMS',
  //     type: 'dropDown',
  //     tooltip: 'Forms',
  //     icon: 'description',
  //     state: 'forms',
  //     sub: [
  //       { name: 'BASIC', state: 'basic' },
  //       { name: 'EDITOR', state: 'editor' },
  //       { name: 'UPLOAD', state: 'upload' },
  //       { name: 'WIZARD', state: 'wizard' }
  //     ]
  //   },
  //   {
  //     name: 'TABLES',
  //     type: 'dropDown',
  //     tooltip: 'Tables',
  //     icon: 'format_line_spacing',
  //     state: 'tables',
  //     sub: [
  //       { name: 'FULLSCREEN', state: 'fullscreen' },
  //       { name: 'PAGING', state: 'paging' },
  //       { name: 'FILTER', state: 'filter' },
  //     ]
  //   },
  //   {
  //     name: 'PROFILE',
  //     type: 'dropDown',
  //     tooltip: 'Profile',
  //     icon: 'person',
  //     state: 'profile',
  //     sub: [
  //       { name: 'OVERVIEW', state: 'overview' },
  //       { name: 'SETTINGS', state: 'settings' },
  //       { name: 'BLANK', state: 'blank' },
  //     ]
  //   },
  //   {
  //     name: 'TOUR',
  //     type: 'link',
  //     tooltip: 'Tour',
  //     icon: 'flight_takeoff',
  //     state: 'tour'
  //   },
  //   {
  //     name: 'MAP',
  //     type: 'link',
  //     tooltip: 'Map',
  //     icon: 'add_location',
  //     state: 'map'
  //   },
  //   {
  //     name: 'CHARTS',
  //     type: 'link',
  //     tooltip: 'Charts',
  //     icon: 'show_chart',
  //     state: 'charts'
  //   },
  //   {
  //     name: 'DND',
  //     type: 'link',
  //     tooltip: 'Drag and Drop',
  //     icon: 'adjust',
  //     state: 'dragndrop'
  //   },
  //   {
  //     name: 'SESSIONS',
  //     type: 'dropDown',
  //     tooltip: 'Pages',
  //     icon: 'view_carousel',
  //     state: 'session',
  //     sub: [
  //       { name: 'SIGNUP', state: 'signup' },
  //       { name: 'SIGNIN', state: 'signin' },
  //       { name: 'FORGOT', state: 'forgot-password' },
  //       { name: 'LOCKSCREEN', state: 'lockscreen' },
  //       { name: 'NOTFOUND', state: '404' },
  //       { name: 'ERROR', state: 'error' }
  //     ]
  //   },
  //   {
  //     name: 'OTHERS',
  //     type: 'dropDown',
  //     tooltip: 'Others',
  //     icon: 'blur_on',
  //     state: 'others',
  //     sub: [
  //       { name: 'GALLERY', state: 'gallery' },
  //       { name: 'PRICINGS', state: 'pricing' },
  //       { name: 'USERS', state: 'users' },
  //       { name: 'BLANK', state: 'blank' },
  //     ]
  //   },
  //   {
  //     name: 'MATICONS',
  //     type: 'link',
  //     tooltip: 'Material Icons',
  //     icon: 'store',
  //     state: 'icons'
  //   },
  //   {
  //     name: 'DOC',
  //     type: 'extLink',
  //     tooltip: 'Documentation',
  //     icon: 'library_books',
  //     state: 'http://egret-doc.mhrafi.com/'
  //   }
  // ]

  // iconMenu: IMenuItem[] = [
  //   {
  //     name: 'HOME',
  //     type: 'icon',
  //     tooltip: 'Home',
  //     icon: 'home',
  //     state: 'home'
  //   },
  //   {
  //     name: 'PROFILE',
  //     type: 'icon',
  //     tooltip: 'Profile',
  //     icon: 'person',
  //     state: 'profile/overview'
  //   },
  //   {
  //     name: 'TOUR',
  //     type: 'icon',
  //     tooltip: 'Tour',
  //     icon: 'flight_takeoff',
  //     state: 'tour'
  //   },
  //   {
  //     type: 'separator',
  //     name: 'Main Items'
  //   },
  //   {
  //     name: 'DASHBOARD',
  //     type: 'link',
  //     tooltip: 'Dashboard',
  //     icon: 'dashboard',
  //     state: 'dashboard'
  //   },
  //   {
  //     name: 'GROUPS',
  //     type: 'dropDown',
  //     tooltip: 'Dialogs',
  //     icon: 'group_work',
  //     state: 'group',
  //     sub: [
  //       { name: 'Black Swan Rapper', state: '13' },
  //       { name: 'Newcastle Kingmen', state: '15' },
  //     ]
  //   },
  //   {
  //     name: 'INBOX',
  //     type: 'link',
  //     tooltip: 'Inbox',
  //     icon: 'inbox',
  //     state: 'inbox'
  //   },
  //   {
  //     name: 'CHAT',
  //     type: 'link',
  //     tooltip: 'Chat',
  //     icon: 'chat',
  //     state: 'chat'
  //   },
  //   {
  //     name: 'CALENDAR',
  //     type: 'link',
  //     tooltip: 'Calendar',
  //     icon: 'date_range',
  //     state: 'calendar'
  //   },
  //   {
  //     name: 'DIALOGS',
  //     type: 'dropDown',
  //     tooltip: 'Dialogs',
  //     icon: 'filter_none',
  //     state: 'dialogs',
  //     sub: [
  //       { name: 'CONFIRM', state: 'confirm' },
  //       { name: 'LOADER', state: 'loader' },
  //     ]
  //   },
  //   {
  //     name: 'MATERIAL',
  //     type: 'dropDown',
  //     tooltip: 'Material',
  //     icon: 'favorite',
  //     state: 'material',
  //     sub: [
  //       { name: 'BUTTONS', state: 'buttons' },
  //       { name: 'CARDS', state: 'cards' },
  //       { name: 'GRIDS', state: 'grids' },
  //       { name: 'LISTS', state: 'lists' },
  //       { name: 'MENU', state: 'menu' },
  //       { name: 'TABS', state: 'tabs' },
  //       { name: 'SELECT', state: 'select' },
  //       { name: 'RADIO', state: 'radio' },
  //       { name: 'AUTOCOMPLETE', state: 'autocomplete' },
  //       { name: 'SLIDER', state: 'slider' },
  //       { name: 'PROGRESS', state: 'progress' },
  //       { name: 'SNACKBAR', state: 'snackbar' },
  //     ]
  //   },
  //   {
  //     name: 'FORMS',
  //     type: 'dropDown',
  //     tooltip: 'Forms',
  //     icon: 'description',
  //     state: 'forms',
  //     sub: [
  //       { name: 'BASIC', state: 'basic' },
  //       { name: 'EDITOR', state: 'editor' },
  //       { name: 'UPLOAD', state: 'upload' },
  //       { name: 'WIZARD', state: 'wizard' }
  //     ]
  //   },
  //   {
  //     name: 'TABLES',
  //     type: 'dropDown',
  //     tooltip: 'Tables',
  //     icon: 'format_line_spacing',
  //     state: 'tables',
  //     sub: [
  //       { name: 'FULLSCREEN', state: 'fullscreen' },
  //       { name: 'PAGING', state: 'paging' },
  //       { name: 'FILTER', state: 'filter' },
  //     ]
  //   },
  //   {
  //     name: 'PROFILE',
  //     type: 'dropDown',
  //     tooltip: 'Profile',
  //     icon: 'person',
  //     state: 'profile',
  //     sub: [
  //       { name: 'OVERVIEW', state: 'overview' },
  //       { name: 'SETTINGS', state: 'settings' },
  //       { name: 'BLANK', state: 'blank' },
  //     ]
  //   },
  //   {
  //     name: 'TOUR',
  //     type: 'link',
  //     tooltip: 'Tour',
  //     icon: 'flight_takeoff',
  //     state: 'tour'
  //   },
  //   {
  //     name: 'MAP',
  //     type: 'link',
  //     tooltip: 'Map',
  //     icon: 'add_location',
  //     state: 'map'
  //   },
  //   {
  //     name: 'CHARTS',
  //     type: 'link',
  //     tooltip: 'Charts',
  //     icon: 'show_chart',
  //     state: 'charts'
  //   },
  //   {
  //     name: 'DND',
  //     type: 'link',
  //     tooltip: 'Drag and Drop',
  //     icon: 'adjust',
  //     state: 'dragndrop'
  //   },
  //   {
  //     name: 'SESSIONS',
  //     type: 'dropDown',
  //     tooltip: 'Pages',
  //     icon: 'view_carousel',
  //     state: 'session',
  //     sub: [
  //       { name: 'SIGNUP', state: 'signup' },
  //       { name: 'SIGNIN', state: 'signin' },
  //       { name: 'FORGOT', state: 'forgot-password' },
  //       { name: 'LOCKSCREEN', state: 'lockscreen' },
  //       { name: 'NOTFOUND', state: '404' },
  //       { name: 'ERROR', state: 'error' }
  //     ]
  //   },
  //   {
  //     name: 'OTHERS',
  //     type: 'dropDown',
  //     tooltip: 'Others',
  //     icon: 'blur_on',
  //     state: 'others',
  //     sub: [
  //       { name: 'GALLERY', state: 'gallery' },
  //       { name: 'PRICINGS', state: 'pricing' },
  //       { name: 'USERS', state: 'users' },
  //       { name: 'BLANK', state: 'blank' },
  //     ]
  //   },
  //   {
  //     name: 'MATICONS',
  //     type: 'link',
  //     tooltip: 'Material Icons',
  //     icon: 'store',
  //     state: 'icons'
  //   },
  //   {
  //     name: 'DOC',
  //     type: 'extLink',
  //     tooltip: 'Documentation',
  //     icon: 'library_books',
  //     state: 'http://egret-doc.mhrafi.com/'
  //   }
  // ]
}
