'use strict';

// Configuring the Offerings module
angular.module('offerings').run(['Menus',
  function (Menus) {
    // Add the offerings dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Offerings',
      state: 'offerings',
      type: 'dropdown',
      roles: ['*']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'offerings', {
      title: 'List My Offerings',
      state: 'offerings.listMine'
    });
  }
]);
