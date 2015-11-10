'use strict';

// Configuring the Postings module
angular.module('postings').run(['Menus',
  function (Menus) {
    // Add the postings dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Postings',
      state: 'postings',
      type: 'dropdown',
      roles: ['*']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'postings', {
      title: 'List Postings',
      state: 'postings.list'
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'postings', {
      title: 'New Posting',
      state: 'postings.create',
      roles: ['user']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'postings', {
      title: 'Reply',
      state: 'postings.create',
      roles: ['user']
    });
  }
]);
