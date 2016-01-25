/* indent: 0 */
'use strict';
var path = require('path'),
	watson = require('watson-developer-cloud'),
	extend = require('util')._extend,
	config = require(path.resolve('./config/config'));

var languageCredentials = extend({
	  version: 'v2',
	  username: '<username>',
	  password: '<password>'
	}, config.utils.getServiceCreds('language_translation')); //VCAP_SERVICES


var language_translation = watson.language_translation(languageCredentials); // User language translation service

//Translation method
exports.doTranslate = function(textLanguage, textTranslate, transResult)
{
	console.log("Call into doTranslate is made");
  // TODO: Watson does not support german translation yet.  When they
  // do, we should translate into all 3 languages, to avoid having
  // to translate each time we query the results.  For now, only do
  // translation between arabic and english.
  if (languageCredentials.username === '<username>') {
    console.log('Translation support not available locally!');
    transResult(textTranslate, textTranslate);
  }
  else if (textLanguage === 'en') {
    language_translation.translate({
      text: textTranslate, source: 'en', target: 'ar' },
      function (err, result) {
        if (err) {
          console.log('language_translate error:', err);
          transResult(textTranslate, textTranslate);
        }
        else {
          transResult(textTranslate, result.translations[0].translation);  
        }
      }
    );
  } else if (textLanguage === 'de') {
    transResult(textTranslate, textTranslate);
  } else {    
    language_translation.translate({
      text: textTranslate, source: textLanguage, target: 'en' },
      function (err, result) {
        if (err) {
          console.log('language_translate error:', err);
          transResult(textTranslate, textTranslate);
        }
        else {
          transResult(result.translations[0].translation, result.translations[0].translation);  
        }
      }
    ); 
  }
}

