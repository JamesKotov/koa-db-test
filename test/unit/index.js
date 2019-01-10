'use strict';

const chai = require('chai');
const should = chai.should();

const config = require('../../config/config');

describe('md5 test', () => {

    const md5 = require('../../app/utils/md5');

    it('should generate md5 hash for key', (done) => {
        const key = 'some key value';
        const hash = md5(key);
        hash.should.eql('4dfa11e74bc7c03a649a3f714113eae1');
        done();
    });
});


describe('checkYear test', () => {

    const checkYear = require('../../app/utils/year');

    it('should return year, if it valid and in bounds', (done) => {
        const year = 1999;
        checkYear(year).should.eql(year);
        done();
    });

    it('should return error, if year is not valid', (done) => {
        const year = 'blah!';

        try {
            checkYear(year)
        } catch (err) {
            err.message.should.eql('Invalid year');
        }
        done();
    });

    it('should return error, if year is in future', (done) => {
        const year = (new Date).getFullYear() + 1;

        try {
            checkYear(year)
        } catch (err) {
            err.message.should.eql('Year out of bounds');
        }
        done();
    });

    it('should return error, if year is too deep in past', (done) => {
        const year = config.minSupportedYear - 1;

        try {
            checkYear(year)
        } catch (err) {
            err.message.should.eql('Year out of bounds');
        }
        done();
    });
});