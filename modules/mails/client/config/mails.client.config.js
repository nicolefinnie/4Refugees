'use strict';

// Configuring the Mails module
angular.module('mails').run(['Menus',
  function (Menus) {
    // Add the mails dropdown item
    Menus.addMenuItem('topbar', {
      title: 'InMail',
      state: 'mails',
      type: 'inmail',
      roles: ['user','admin']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'mails', {
      title: 'Show New Mails',
      state: 'mails.listnew'
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'mails', {
      title: 'Your Mail',
      state: 'mails.list'
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'mails', {
      title: 'Send New Mail',
      state: 'mails.createadmin',
      roles: ['admin']
    });
  }
]);
