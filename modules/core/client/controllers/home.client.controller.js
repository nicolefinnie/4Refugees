'use strict';

//TODO move those to another file only with constants in the future 
//English
var HEADLINE_EN = 'Welcome to Germany';
var SUBHEADLINE_EN = 'Hi there, how can we help you today?';

var QUICKHELP_TITLE_EN = 'Germany in a nutshell';
var FINDHELP_TITLE_EN = 'Coordinating Help';
var HELPOTHERS_TITLE_EN = 'You are one of us';

var QUICKHELP_SUBTITLE_EN = 'Register in the city hall, open a bank account, get health care, learn languages, find schools';
var FINDHELP_SUBTITLE_EN = 'We take your geo location into account to make it easy to find nearby offers and requests';
var HELPOTHERS_SUBTITLE_EN = 'You are not alone. We try to connect refugees who need help and people who want to offer help';

var QUICKHELP_EN = 'Quick Help';
var FINDHELP_EN = 'Find Help';
var HELPOTHERS_EN = 'Help Others';


//German
var HEADLINE_DE = 'Wilkommen Deutschland';
var SUBHEADLINE_DE = 'Guten Tag, wie können wir Ihnen hilfen?';

var QUICKHELP_TITLE_DE = 'Deutschland auf einen Blick';
var FINDHELP_TITLE_DE = 'Koordinierende Hilfe';
var HELPOTHERS_TITLE_DE = 'Du bist einer von uns';

var QUICKHELP_SUBTITLE_DE = 'Beim Rathaus anmelden, ein Bankkonto eröffnen, Krankenversicherung abschliessen, Sprachen lernen, Schule für Kinder suchen';
var FINDHELP_SUBTITLE_DE = 'Wir nehmen Ihre Geographische Lage und berechnen die Entfernung um Angebote und Suche möglichst in der Nähe zu finden';
var HELPOTHERS_SUBTITLE_DE = 'Du bist nicht allein. Wir versuchen die Flüchtlinge, die Hilfe brauchen, mit den Leuten, die Hilfe anbieten zu verbinden';

var QUICKHELP_DE = 'Erste Hilfe';
var FINDHELP_DE = 'Hilfe Brauchen';
var HELPOTHERS_DE = 'Anderen Helfen';

//Arabic
var HEADLINE_AR = 'أهلا بكم في ألمانيا';
var SUBHEADLINE_AR = 'مرحبا، كيف يمكننا مساعدتك اليوم?';

var QUICKHELP_TITLE_AR = 'ألمانيا باختصار';
var FINDHELP_TITLE_AR = 'تنسيق المساعدة';
var HELPOTHERS_TITLE_AR = 'كنت واحدا منا';

var QUICKHELP_SUBTITLE_AR = 'التسجيل، فتح حساب مصرفي، والحصول على الرعاية الصحية، تعلم اللغات، والعثور على المدارس';
var FINDHELP_SUBTITLE_AR = 'نحن نأخذ الموقع الجغرافي الخاص بك في الاعتبار أن تجعل من السهل العثور على العروض المجاورة وطلبات ';
var HELPOTHERS_SUBTITLE_AR = 'انت لست وحدك. نحن نحاول ربط اللاجئين الذين يحتاجون المساعدة والأشخاص الذين يرغبون في تقديم المساعدة';

var QUICKHELP_AR = 'تعليمات سريعة';
var FINDHELP_AR = 'البحث عن مساعدة';
var HELPOTHERS_AR = 'ساعد الاخرين';


angular.module('core').controller('HomeController', ['$scope', '$rootScope','Authentication',
  function ($scope, $rootScope, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    
    //initial setup
    $scope.headline = HEADLINE_EN;
    $scope.subheadline = SUBHEADLINE_EN;
    
    $scope.quickHelpTitle = QUICKHELP_TITLE_EN;
    $scope.findHelpTitle = FINDHELP_TITLE_EN;
    $scope.helpOthersTitle = HELPOTHERS_TITLE_EN;
 
    $scope.quickHelpSubtitle = QUICKHELP_SUBTITLE_EN;
    $scope.findHelpSubtitle = FINDHELP_SUBTITLE_EN;
    $scope.helpOthersSubtitle = HELPOTHERS_SUBTITLE_EN;
    
    $scope.quickHelpButton = QUICKHELP_EN;
    $scope.findHelpButton = FINDHELP_EN;
    $scope.helpOthersButton = HELPOTHERS_EN;
    
    
    if ($rootScope.currentLanguage === 'ar') {
      $scope.headline = HEADLINE_AR;
      $scope.subheadline = SUBHEADLINE_AR;

      $scope.quickHelpTitle = QUICKHELP_TITLE_AR;
      $scope.findHelpTitle = FINDHELP_TITLE_AR;
      $scope.helpOthersTitle = HELPOTHERS_TITLE_AR;

      $scope.quickHelpSubtitle = QUICKHELP_SUBTITLE_AR;
      $scope.findHelpSubtitle = FINDHELP_SUBTITLE_AR;
      $scope.helpOthersSubtitle = HELPOTHERS_SUBTITLE_AR;
      
      $scope.quickHelpButton = QUICKHELP_AR;
      $scope.findHelpButton = FINDHELP_AR;
      $scope.helpOthersButton = HELPOTHERS_AR;
  
    } else if ($rootScope.currentLanguage === 'en') {
      $scope.headline = HEADLINE_EN;
      $scope.subheadline = SUBHEADLINE_EN;
 
      $scope.quickHelpTitle = QUICKHELP_TITLE_EN;
      $scope.findHelpTitle = FINDHELP_TITLE_EN;
      $scope.helpOthersTitle = HELPOTHERS_TITLE_EN;
      
      $scope.quickHelpSubtitle = QUICKHELP_SUBTITLE_EN;
      $scope.findHelpSubtitle = FINDHELP_SUBTITLE_EN;
      $scope.helpOthersSubtitle = HELPOTHERS_SUBTITLE_EN;
      
      $scope.quickHelpButton = QUICKHELP_EN;
      $scope.findHelpButton = FINDHELP_EN;
      $scope.helpOthersButton = HELPOTHERS_EN;
    
    } else if ($rootScope.currentLanguage === 'de') {
      $scope.headline = HEADLINE_DE;
      $scope.subheadline = SUBHEADLINE_DE;
      
      $scope.quickHelpTitle = QUICKHELP_TITLE_DE;
      $scope.findHelpTitle = FINDHELP_TITLE_DE;
      $scope.helpOthersTitle = HELPOTHERS_TITLE_DE;
   
      $scope.quickHelpSubtitle = QUICKHELP_SUBTITLE_DE;
      $scope.findHelpSubtitle = FINDHELP_SUBTITLE_DE;
      $scope.helpOthersSubtitle = HELPOTHERS_SUBTITLE_DE;
      
      $scope.quickHelpButton = QUICKHELP_DE;
      $scope.findHelpButton = FINDHELP_DE;
      $scope.helpOthersButton = HELPOTHERS_DE;
    
    }
 
  }
]);


