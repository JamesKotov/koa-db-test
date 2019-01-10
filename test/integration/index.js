'use strict';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../../app/app');
const config = require('../../config/config');

describe('routes', () => {

    describe('GET /authors', () => {
        it('should return json with array of authors', (done) => {
            chai.request(server)
                .get('/authors')
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    res.body.authors.should.to.be.an('array');
                    done();
                });
        });
    });


    describe('GET /authors/:id', () => {
        it('should return json', (done) => {
            chai.request(server)
                .get('/authors/1')
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    done();
                });
        });

        it('should return authors array with 1 item', (done) => {
            chai.request(server)
                .get('/authors/1')
                .end((err, res) => {
                    res.body.authors.should.to.be.an('array');
                    res.body.authors.should.to.have.lengthOf(1);
                    done();
                });
        });

        it('should return empty array if author not exists', (done) => {
            chai.request(server)
                .get('/authors/9999999')
                .end((err, res) => {
                    res.body.authors.should.to.be.an('array');
                    res.body.authors.should.to.be.empty;
                    done();
                });
        });

        it('should return error if author id is invalid', (done) => {
            chai.request(server)
                .get('/authors/blah')
                .end((err, res) => {
                    res.status.should.eql(500);
                    res.type.should.eql('application/json');
                    res.body.message.should.eql('Invalid id');
                    done();
                });
        });
    });


    describe('GET /authors/search/:fragment', () => {
        it('should return json with found authors', (done) => {
            const authorName = 'Волков';
            chai.request(server)
                .get('/authors/search/' + encodeURIComponent(authorName))
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    res.body.authors.should.to.be.an('array');

                    const authorNameLowercase = authorName.toLowerCase();
                    res.body.authors.forEach((author) => {
                        author.name.toLowerCase().should.to.include(authorNameLowercase);
                    });
                    done();
                });
        });
    });


    describe('GET /books', () => {
        it('should return json with array of books', (done) => {
            chai.request(server)
                .get('/books')
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    res.body.books.should.to.be.an('array');
                    done();
                });
        });
    });


    describe('GET /books/:id', () => {
        it('should return json', (done) => {
            chai.request(server)
                .get('/books/1')
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    done();
                });
        });

        it('should return books array with 1 item', (done) => {
            chai.request(server)
                .get('/books/1')
                .end((err, res) => {
                    res.body.books.should.to.be.an('array');
                    res.body.books.should.to.have.lengthOf(1);
                    done();
                });
        });

        it('should return empty array if author not exists', (done) => {
            chai.request(server)
                .get('/books/9999999')
                .end((err, res) => {
                    res.body.books.should.to.be.an('array');
                    res.body.books.should.to.be.empty;
                    done();
                });
        });

        it('should return error if author id is invalid', (done) => {
            chai.request(server)
                .get('/books/blah')
                .end((err, res) => {
                    res.status.should.eql(500);
                    res.type.should.eql('application/json');
                    res.body.message.should.eql('Invalid id');
                    done();
                });
        });
    });


    describe('GET /books/year/:year', () => {
        it('should return json with found books of passed year', (done) => {
            const year = 2014;
            chai.request(server)
                .get('/books/year/' + year)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    res.body.books.should.to.be.an('array');

                    res.body.books.forEach((book) => {
                        book.year.should.to.eql(year);
                    });
                    done();
                });
        });

        it('should return json with empty collection if none books released in this year', (done) => {
            const year = 2019;
            chai.request(server)
                .get('/books/year/' + year)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    res.body.books.should.to.be.an('array');
                    res.body.books.should.to.be.empty;
                    done();
                });
        });

        it('should return json error for year that too in past', (done) => {
            const year = config.minSupportedYear - 1;
            chai.request(server)
                .get('/books/year/' + year)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(500);
                    res.type.should.eql('application/json');
                    res.body.message.should.eql('Year out of bounds');
                    done();
                });
        });

        it('should return json error for year that in future', (done) => {
            const year = (new Date).getFullYear() + 1;
            chai.request(server)
                .get('/books/year/' + year)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(500);
                    res.type.should.eql('application/json');
                    res.body.message.should.eql('Year out of bounds');
                    done();
                });
        });
    });


    describe('GET /books/author/:id', () => {
        it('should return json with author and found books', (done) => {
            const authorId = 1;
            chai.request(server)
                .get('/books/author/' + authorId)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    res.body.author.id.should.eql(authorId);

                    const authorName = res.body.author.name;

                    res.body.books.should.to.be.an('array');

                    res.body.books.forEach((book) => {
                        book.authors.should.to.include(authorName);
                    });
                    done();
                });
        });

        it('should return json with error if author not exists', (done) => {
            const authorId = 999999;
            chai.request(server)
                .get('/books/author/' + authorId)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(500);
                    res.type.should.eql('application/json');
                    res.body.message.should.eql('Author not exists');
                    done();
                });
        });
    });

    describe('POST /authors', () => {

        const authorName = 'Новый Тестовый' + (new Date()).getTime();

        it('should add new author ' + authorName, (done) => {
            chai.request(server)
                .post('/authors')
                .send({name: authorName})
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    done();
                });
        });


        it('should return error if adding an existing author', (done) => {
            chai.request(server)
                .post('/authors')
                .send({name: authorName})
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(500);
                    res.type.should.eql('application/json');
                    res.body.message.should.eql(`Duplicate entry '${authorName}' for key 'name'`);
                    done();
                });
        });
    });


    describe('PUT /authors/:id', () => {

        const authorId = 777;
        const authorName = 'Редактируемый Тестовый' + (new Date()).getTime();


        it(`should update author with id = ${authorId} to ${authorName}`, (done) => {

            // test old name of author
            chai.request(server)
                .get('/authors/' + authorId)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(200);
                    res.type.should.eql('application/json');
                    res.body.authors[0].should.exist;
                    res.body.authors[0].name.should.not.eql(authorName);

                    // updating name of author
                    chai.request(server)
                        .put('/authors/' + authorId)
                        .send({name: authorName})
                        .end((err, res) => {
                            should.not.exist(err);
                            res.status.should.eql(200);
                            res.type.should.eql('application/json');

                            // test new name of author
                            // this needs to disable caching for work!
                            chai.request(server)
                                .get('/authors/' + authorId)
                                .end((err, res) => {
                                    should.not.exist(err);
                                    res.status.should.eql(200);
                                    res.type.should.eql('application/json');
                                    res.body.authors[0].should.exist;
                                    res.body.authors[0].name.should.eql(authorName);
                                    done();
                                });
                        });
                });
        });
    });


    describe('POST /books', () => {

        it(`TODO: should write test for adding a book!`, (done) => {
            done();
        });

    });


    describe('PUT /books/:id', () => {

        it(`TODO: should write test for editing a book!`, (done) => {
            done();
        });

    });

});
