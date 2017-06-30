'use strict'
const chai = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
chai.use(require('chai-as-promised'))
const expect = require('chai').expect

describe('Blog Lambda', () => {
  let event
  let callback
  let context
  let lambda
  let proxyDynamoDB
  let dynamoDbGetStub

  beforeEach(() => {
    event = {
      post_id: 'your-post-id'
    }
    callback = (error, result) => {
      return new Promise((resolve, reject) => {
        error ? reject(error) : resolve(result)
      })
    }
    context = {}
    proxyDynamoDB = class {
      get (params) {
        return {
          promise: () => {}
        }
      }
    }
    lambda = proxyquire('./handler', {
      'aws-sdk': {
        DynamoDB: {
          DocumentClient: proxyDynamoDB
        }
      }
    })
  })

  it('Should return resolve when running successfully', () => {
    dynamoDbGetStub = sinon.stub(proxyDynamoDB.prototype, 'get')
    .returns({promise: () => {
      return Promise.resolve({
        Item: {
          post_title: 'aa',
          post_content: 'bb'
        }
      })
    }})
    return expect(lambda.blog(event, context, callback)).to.be.fulfilled.then(result => {
      expect(dynamoDbGetStub.calledOnce).to.be.equal(true)
      expect(result).to.deep.equal(JSON.stringify({
        statusCode: 200,
        body: {post_title: 'aa', post_content: 'bb'}
      }))
    })
  })

  it('Should return reject when post_id is not given', () => {
    event = {}
    dynamoDbGetStub = sinon.stub(proxyDynamoDB.prototype, 'get')
    .returns({promise: () => {
      return Promise.resolve({
        Item: {
          post_title: 'aa',
          post_content: 'bb'
        }
      })
    }})
    return expect(lambda.blog(event, context, callback)).to.be.rejected.then(result => {
      expect(dynamoDbGetStub.calledOnce).to.be.equal(false)
      expect(result).to.deep.equal(JSON.stringify({
        statusCode: 400,
        body: {message: 'invalid param'}
      }))
    })
  })

  it('Should return reject when you can not your item in DB', () => {
    dynamoDbGetStub = sinon.stub(proxyDynamoDB.prototype, 'get')
    .returns({promise: () => {
      return Promise.resolve({})
    }})
    return expect(lambda.blog(event, context, callback)).to.be.rejected.then(result => {
      expect(dynamoDbGetStub.calledOnce).to.be.equal(true)
      expect(result).to.deep.equal(JSON.stringify({
        statusCode: 404,
        body: {message: 'can not find specified post'}
      }))
    })
  })

  it('Should return reject when error occurs in DB', () => {
    dynamoDbGetStub = sinon.stub(proxyDynamoDB.prototype, 'get')
    .returns({promise: () => {
      return Promise.reject('error')
    }})
    return expect(lambda.blog(event, context, callback)).to.be.rejected.then(result => {
      expect(dynamoDbGetStub.calledOnce).to.be.equal(true)
      expect(result).to.be.equal('error')
    })
  })

  afterEach(() => {
    proxyDynamoDB.prototype.get.restore()
  })
})
