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

    // Add the dropdown search item
    Menus.addSubMenuItem('topbar', 'offerings', {
      title: 'Search All Offerings',
      state: 'offerings.searchAll'
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'offerings', {
      title: 'Create Offerings',
      state: 'offerings.create',
      roles: ['user']
    });
  }
]);
