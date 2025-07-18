const { expect } = require('chai');
    const supertest = require('supertest');
    const sinon = require('sinon');
    const app = require('../index');

    describe('Upload Handler', () => {
      it('should process Movie_Ratings_Reviews.csv and detect Advertising domain', async () => {
        const res = await supertest(app)
          .post('/api/v1/upload')
          .set('Authorization', 'Bearer valid_token')
          .attach('file', 'test/Movie_Ratings_Reviews.csv')
          .field('domain', 'advertising');
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal('File uploaded, analysis started');
      });
    });