'use strict';

describe('Postings E2E Tests:', function () {
  describe('Test postings page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/postings');
      expect(element.all(by.repeater('posting in postings')).count()).toEqual(0);
    });
  });
});
