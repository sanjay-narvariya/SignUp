var express = require('express');
var router = express.Router();
var pool = require('./pool');
var { LocalStorage } = require("node-localstorage");
var localStorage = new LocalStorage('./scratch');
const bcrypt = require('bcrypt')

const dotenv = require('dotenv');
dotenv.config();




router.post('/user-edit', async function (req, res, next) {
  try {
      const {
          firstname, lastname, gender, dob, mobileno, pincode, houseno,
          address, city, state, country, mailid, userid
      } = req.body;

      if (!mailid || !userid) {
          return res.status(400).json({ message: 'mailid and userid are required', status: false });
      }

      const query = `UPDATE useraddress 
                     SET firstname=?, lastname=?, gender=?, dob=?, mobileno=?, 
                         pincode=?, houseno=?, address=?, city=?, state=?, country=? 
                     WHERE mailid=? AND userid=?`;

      pool.query(query, [firstname, lastname, gender, dob, mobileno, pincode, houseno, 
                         address, city, state, country, mailid, userid], 
          function (error, result) {
              if (error) {
                  console.error('Database Error:', error);
                  return res.status(500).json({ message: 'Database error, please contact the backend team.', status: false });
              }

              if (result.affectedRows === 0) {
               
                  return res.status(404).json({ message: 'No record found to update', status: false });
              }
              console.log(result.affectedRows)
              res.status(200).json({ message: 'Edited Successfully', status: true });
          }
      );
  } catch (e) {
      console.error('Server Error:', e);
      res.status(500).json({ message: 'Severe error on server, please contact the backend team.', status: false });
  }
});


/*

router.post('/check_user_mobileno', function (req, res, next) {
    console.log(req.body)
    try {
  
      pool.query("select * from usersdata where mobileno=?", [req.body.mobileno],
        function (error, result) {
          if (error) {
            console.log(error)
            res.status(500).json({ message: 'Database error please contact with backendteam...', status: false })
          }
          else {
            if (result.length == 1) {
              res.status(200).json({ message: 'Mobile no is exist', data: result[0], status: true })
            }
            else {
              res.status(200).json({ message: 'Mobile no is not exist', data: [], status: false })
            }
          }
        })
    }
    catch (e) {
      res.status(200).json({ message: 'Severe error on server please contact with backendteam..', status: false })
    }
  });
  
  
  
  router.post('/submit_user_data', function (req, res, next) {
    try {
  
      pool.query("insert into usersdata(firstname, lastname, gender, emailaddress, dob, mobileno) values(?,?,?,?,?,?)", [req.body.firstname, req.body.lastname, req.body.gender, req.body.emailaddress, req.body.dob, req.body.mobileno],
        function (error, result) {
          if (error) {
            console.log(error)
            res.status(500).json({ message: 'Database error please contact with backendteam...', status: false })
          }
          else {
            console.log(result)
            res.status(200).json({ message: 'Successfully Registered...', status: true, userid: result.insertId })
  
          }
        })
    }
    catch (e) {
      res.status(200).json({ message: 'Severe error on server please contact with backendteam..', status: false })
    }
  });
  */
  
  
  router.post('/check_user_address', function (req, res, next) {
    try {
      console.log("DATA:", req.body)
      pool.query("select * from useraddress where userid=?", [req.body.userid],
        function (error, result) {
          if (error) {
            console.log(error)
            res.status(500).json({ message: 'Database error please contact with backendteam...', status: false })
          }
          else {
            if (result.length >= 1) {
              res.status(200).json({ message: 'Address is found', data: result, status: true })
            }
            else {
              res.status(200).json({ message: 'Address is not found', data: [], status: false })
            }
          }
        })
    }
    catch (e) {
      res.status(200).json({ message: 'Severe error on server please contact with backendteam..', status: false })
    }
  });
  


  router.post('/submit_user_address', function (req, res, next) {
    try {
  
      pool.query("insert into useraddress(userid, firstname, lastname, gender, mailid, dob, mobileno, pincode, houseno, address, city, state, country) values(?,?,?,?,?,?,?,?,?,?,?,?,?)", [req.body.userid, req.body.firstname, req.body.lastname, req.body.gender, req.body.mailid, req.body.dob, req.body.mobileno, req.body.pincode, req.body.houseno, req.body.address, req.body.city, req.body.state, req.body.country],
        function (error, result) {
          if (error) {
            console.log(error)
            res.status(200).json({ message: 'Database error please contact with backendteam...', status: false })
          }
          else {
            console.log(result)
            res.status(200).json({ message: 'Address successfully submitted..', status: true, userid: result.insertId })
  
          }
        })
    }
    catch (e) {
      res.status(200).json({ message: 'Severe error on server please contact with backendteam..', status: false })
    }
  });
  
  




module.exports=router