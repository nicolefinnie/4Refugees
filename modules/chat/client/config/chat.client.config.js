'use strict';

var CHAT_EN = 'Chat';
var CHAT_DE = 'Chat';
var CHAT_AR = 'دردشة';
// TODO either we don't have Chat module on the header or we need to fix the language translation
// Configuring the Chat module
angular.module('chat').run(['$rootScope', 'Menus',  
  function ($rootScope, Menus) {
  
    var chatInCurrentLanguage = CHAT_EN;
    if ($rootScope.currentLanguage === 'de') {
      chatInCurrentLanguage = CHAT_DE;
    } else if ($rootScope.currentLanguage === 'ar') {
      chatInCurrentLanguage = CHAT_AR;
    }
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      
      title: chatInCurrentLanguage,
      state: 'chat'
    });
  }


]);
