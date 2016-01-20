'use strict';

describe('Matches E2E Tests:', function () {
  describe('Test matches page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/matches');
      expect(element.all(by.repeater('match in matches')).count()).toEqual(0);
    });
  });
});
