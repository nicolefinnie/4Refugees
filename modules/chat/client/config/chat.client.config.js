'use strict';

// TODO  we don't need chat menu on the hader
// Configuring the Chat module
angular.module('chat').run(['$rootScope', 'Menus',  
  function ($rootScope, Menus) {
    
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      title: 'Chat',
      state: 'chat'
    });
   
  }


]);
