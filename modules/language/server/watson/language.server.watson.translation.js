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


var translationService = watson.language_translation(languageCredentials); // User language translation service

// Helper function to tolerate translation failures, by replacing
// failed translations with best possible match.  For now, the best
// possible match is the English version of the text, if available,
// since the hope is most people will likely know some basic English.
function substituteForTranslationFailures(translationResult) {
  var foundSubstitute = false;
  var substituteText;
  translationResult.targets.forEach(function(target) {
    if (target.success && target.language === 'en') {
      substituteText = target.text;
      foundSubstitute = true;
    }
  });
  if (!foundSubstitute) {
    substituteText = translationResult.source.text;
  }
  translationResult.targets.forEach(function(target) {
    if (!target.success) {
      target.text = substituteText;
    }
  });
}

// Helper function to add the next translation result to the
// array of all translation results.
function addTranslationToResults(results, translation) {
  var tempResult = {
    success: translation.success,
    errorMessage: translation.errorMessage,
    language: translation.target.language,
    text: translation.target.text
  };
  results.targets.push(tempResult);
}

// Helper function to setup the individual translation requests, when the
// caller wants to translate to all possible languages
function setupTranslationRequests(requests, sourceLanguage, sourceText) {
  var newRequest = {
    'sourceLanguage': sourceLanguage,
    'sourceText': sourceText
  };

  if (sourceLanguage === 'en') {
    newRequest.targetLanguage = 'ar';
    requests.push(newRequest);
    newRequest.targetLanguage = 'de';
    requests.push(newRequest);
  } else if (sourceLanguage === 'ar') {
    newRequest.targetLanguage = 'en';
    requests.push(newRequest);
    newRequest.targetLanguage = 'de';
    requests.push(newRequest);
  } else {
    newRequest.targetLanguage = 'en';
    requests.push(newRequest);
    newRequest.targetLanguage = 'ar';
    requests.push(newRequest);
  }
}

function translateSingleLanguage(request, callback) {
  var translationResult = {
    success: false,
    errorMessage: '',
    source: {
      language: request.sourceLanguage,
      text: request.sourceText
    },
    target: {
      language: request.targetLanguage,
      text: ''
    }
  };

  if (languageCredentials.username === '<username>' || request.sourceLanguage === 'de' || request.targetLanguage === 'de') {
    if (languageCredentials.username === '<username>') {
      // No local translation support.
      translationResult.errorMessage = 'Translation support not available locally';
    } else if (request.sourceLanguage === 'de' || request.targetLanguage === 'de') {
      // Watson does not yet support German translations
      translationResult.errorMessage = 'German translation not yet supported';
    }
    console.log(translationResult.errorMessage);
    callback(translationResult);
  } else {
    var watsonParms = {
      text: request.sourceText,
      source: request.source.language,
      target: request.target.language
    };
    translationService.translate(watsonParms, function (err, result) {
      if (err) {
        translationResult.errorMessage = 'Watson language_translate error: ' + err;
        console.log(translationResult.errorMessage);
      } else {
        translationResult.success = true;
        translationResult.target.text = result.translations[0].translation;
      }
      callback(translationResult);
    }); 
  }
}

// API to translate text from the source language into a single target language
exports.translateSingleLanguage = translateSingleLanguage;

// API to translate text from the source language into all supported target languages
// Callers can pass in 'request.substituteOnFailure' so that the best possible
// translated text is returned, if proper translation is not available.
exports.translateAllLanguages = function(request, callback) {
  var translationResult = {
    source: {
      language: request.sourceLanguage,
      text: request.sourceText
    },
    targets: []
  };
  var requests = [];
  setupTranslationRequests(requests, request.sourceLanguage, request.sourceText);

  translateSingleLanguage(requests[0], function(firstResult) {
    addTranslationToResults(translationResult, firstResult);
    translateSingleLanguage(requests[1], function(secondResult) {
      addTranslationToResults(translationResult, secondResult);

      // After we have all possible translation results, setup translation
      // substitutions for any failures, if desired.
      if (request.substituteOnFailure) {
        substituteForTranslationFailures(translationResult);
      }
      callback(translationResult);
    });
  });
};

