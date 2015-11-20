'use strict';

// Configuring the Postings module
angular.module('postings').run(['Menus',
  function (Menus) {
    // Add the postings dropdown item
    Menus.addMenuItem('topbar', {
      title: 'InMail',
      state: 'postings',
      type: 'inmail',
      roles: ['user','admin']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'postings', {
      title: 'Show New Mails',
      state: 'postings.listnew'
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'postings', {
      title: 'Your Mail',
      state: 'postings.list'
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'postings', {
      title: 'Send New Mail',
      state: 'postings.createadmin',
      roles: ['admin']
    });
  }
]);
