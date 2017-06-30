'use strict'
const aws = require('aws-sdk')
const dynamodb = new aws.DynamoDB.DocumentClient()

module.exports.blog = (event, context, callback) => {
  return Promise.resolve().then(() => {
    if (!event.post_id) {
      return Promise.reject(responseBilder(400, {message: 'invalid param'}))
    }

    const params = {
      TableName: 'Blog',
      Key: {
        post_id: event.post_id
      }
    }
    return dynamodb.get(params).promise()
  }).then(data => {
    if (!Object.keys(data).length) {
      return Promise.reject(responseBilder(404, {message: 'can not find specified post'}))
    } else {
      return Promise.resolve(responseBilder(200, {
        post_title: data.Item.post_title,
        post_content: data.Item.post_content
      }))
    }
  })
  .then(result => callback(null, result))
  .catch(error => callback(error))
}

const responseBilder = (statusCode, data) => {
  return JSON.stringify({
    statusCode: statusCode,
    body: data
  })
}
