require("dotenv").config();
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

const ServerAuthorization = (req,res,next)=>{
    // console.log('ServerAuthorization req = ',req);
    const options = {
        method: 'POST',
        url: process.env.SERVER_VALIDATION_URL,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            grant_type: process.env.SERVER_VALIDATION_grant_type,
            client_id: process.env.SERVER_VALIDATION_client_id,
            client_secret: process.env.SERVER_VALIDATION_client_secret
        }
    };
    // console.log('ServerAuthorization options = ',options);
    rp(options)
    .then((response) => {
      // console.log('ServerAuthorization response = ',response);
      const token = JSON.parse(response).access_token;
      var accessToken = token;
      //accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJoNTZiNW9kNEZWVDZ0OEVCUGhjeUVzcVVUNE5pa0lReTV0RHdnSUtGenpvIn0.eyJleHAiOjE2Nzc0MDE0NTcsImlhdCI6MTY3NzQwMTE1NywianRpIjoiMTRhYzE0YzAtYjJmMC00NmZiLWJiOGEtMjExYTY0Njg1OGY1IiwiaXNzIjoiaHR0cHM6Ly9pZHBpZmljLm9zcy5uZXQuYmQvcmVhbG1zL3Rlc3QiLCJhdWQiOlsiYWNjb3VudCIsIm5vZGVqcy1yZXNvdXJjZS1zZXJ2ZXIiXSwic3ViIjoiZDkwYmQ4MmMtODEwNy00ZWI3LTllMDctNTQ1MGFlYjZiOGI0IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoibm9kZWpzLWFwcC1jbGllbnQiLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtdGVzdCIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX0sIm5vZGVqcy1yZXNvdXJjZS1zZXJ2ZXIiOnsicm9sZXMiOlsibm9kZWpzLXJlc291cmNlLXNlcnZlciJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoibm9kZWpzLWFwcC1jbGllbnQiLCJjbGllbnRIb3N0IjoiMTc1LjI5LjE2MC4yNTAiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1ub2RlanMtYXBwLWNsaWVudCIsImNsaWVudEFkZHJlc3MiOiIxNzUuMjkuMTYwLjI1MCJ9.MdZYuxWAaVY7wQOJvLGRs2Z9aI29XhGwpxh95rhV1MNk-izpf6DSnrAm6iZOPb8c6trU5-M5AVH2BuHhemuAzAskVFxzptWZTl6rFFLjuWrwLzevMF5WFtxjBnMUWhYJti483AbOqK7CHu3EJYV-SgD7MSKoxLo-yocclycm1JP_KdBTsxhPVWNfnSbuArtqbcZ3VVhV9Y5i61m6zFfZfPYxi_Uiajiow7EIDczrT7b0_ZdeP4oQijCbz8FrOO6b3ZDlEeKO3iGuXcD2HypiYCbkAC_MTXvkRTzMzE6Ue_4zFptB0Kb3wOPU3y4ubOwLdClbxJro3MpNMfOccwNi1w';
      // console.log('ServerAuthorization accessToken = ',accessToken);
      
      const client = jwksClient({
          jwksUri: process.env.SERVER_VALIDATION_jwksUri
        });
        // console.log('ServerAuthorization client = ',client);
        
        function getKey(header, callback) {
            client.getSigningKey(header.kid, function(err, key) {
                const signingKey = key.publicKey || key.rsaPublicKey;
                callback(null, signingKey);
            });
        }
        // console.log('ServerAuthorization getKey = ',getKey);

        jwt.verify(accessToken, getKey, function(err, decoded) {
          let errorFlag = false;
          try{
            if(err){
              errorFlag = true;
              throw err;
            }
          }catch(err){
            if (err instanceof jwt.TokenExpiredError) {
              // console.log("The Token is Expired!");
              return res.status(401).json({ error: 'Server Token has expired.' }); 
            } else {
              // console.log("Token is invalid for some other reason");
              return res.status(401).json({ error: 'Server Token is invalid.' }); 
            }
          }
          if(!errorFlag){
            // console.log("The Server is Authorized!");
            next();
          }
          else {
            // console.log("The Server is not Authrozed!");
            return res.status(401).json({ error: 'The Server is not Authrozed!' }); 
          }
      });
  })
  .catch((error) => {
    console.error(error);
  });

  }

  module.exports = {
    ServerAuthorization
  }