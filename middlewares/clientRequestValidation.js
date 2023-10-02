const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('request');
const app = express();
const port = 9000;
const rp = require('request-promise');
const https = require('https');
const jwksClient = require('jwks-rsa');
const { decode } = require('punycode');
const http = require('http');


const isValidRequestFromClient = (req, res, next) => {
    // console.log('req.headers.userId = ' , req.headers.userId);
    const str = req.headers.authorization;
    // console.log('req.headers.authorization = ' , req.headers.authorization);
    if (req.headers.authorization === undefined) {
        return res.status(401).json({ status:'401' , error: 'Token not found.' }); 
    }
    let nStrToken = str.replace(/Bearer/g,' ');
    // console.log('nStrToken = ',nStrToken);
    nStrToken = nStrToken.trim();
    // console.log('nStrToken after trim = ',nStrToken);
    
    const decodedClientToken = jwt.decode(nStrToken);
    // console.log("decodedClientToken = ",decodedClientToken);
    if (!decodedClientToken){
      //   console.log('Token has expired....');
        return res.status(401).json({ status:'401' , error: 'Token is invalid.' }); 
      } 
    const expiryTime = decodedClientToken?.exp;
    // console.log("expiryTime = ",expiryTime);
    const currentTime = Math.floor(Date.now() / 1000);
    let timeValidationOk = true;
    if (expiryTime < currentTime){
      timeValidationOk = false;
    //   console.log('Token has expired....');
      return res.status(401).json({ status:'401' , error: 'Token has expired.' }); 
    } 
    if(timeValidationOk){
        next(); 
    }
}

module.exports = {
    isValidRequestFromClient
}