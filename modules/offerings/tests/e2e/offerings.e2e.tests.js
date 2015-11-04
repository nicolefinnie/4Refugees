'use strict';

describe('Offerings E2E Tests:', function () {
  describe('Test offerings page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/offerings');
      expect(element.all(by.repeater('offering in offerings')).count()).toEqual(0);
    });
  });
});
