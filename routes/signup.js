var express = require('express');
var router = express.Router();
var pool = require('./pool');

const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const otpGenerator = require('otp-generator')
const passwordGenerator = require('generate-otp')
const dotenv = require('dotenv');
const { SMTP_MAIL, SMTP_PASSWORD } = process.env
const bcrypt = require('bcrypt')


const randomToken = passwordGenerator.generate(6);
const sendMail = async (mailid, mailSubject, content) => {
  console.log(mailid,mailSubject,content)
  try {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: SMTP_MAIL,
        pass: SMTP_PASSWORD,
      }
    })

    const mailOptions = {
      from: SMTP_MAIL,
      to: mailid,
      subject: mailSubject,
      html: content,
    }

    transport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error)
      }
      else {
        console.log('Mail sent successfully:-', info.response)
      }
    })

  }
  catch (error) {
    console.log(error)
  }
}

router.post('/signup_user', function(req, res, next) {
  try {
  
     pool.query("insert into otpverify (mailid,otp) values(?,?)", [ req.body.mailid,randomToken],function (error, result) {
        if (error) 
          {
          res.status(403).json({ message: 'Database error please contact with backendteam...', status: false })
        }
        else {
               
          pool.query("select * from otpverify where mailid=? ",[ req.body.mailid],
             function (error, result) {
              let mailSubject = 'Mail Verification';
              let content = 'Hii ' + req.body.firstname +' ' + req.body.lastname + ' token is  ' + randomToken + ' to verify your mail';
               sendMail(req.body.mailid, mailSubject, content);
                   if(error)
                   {
                    res.status(403).json({ message: 'Database error please contact with backendteam...', status: false })
                   }
                   else{
                    console.log('Otp sent to verify on mailid',result)
                    res.status(200).json({ message: 'Otp sent to verify on mailid', status: true })
                   }
             })
         
        }
      })
  }
  catch (e) {
    res.status(500).json({ message: 'Severe error on server please contact with backendteam..', status: false })
  }
});




router.post('/submit_otp',function(req,res,next){
      try{
        pool.query("select * from otpverify where otp=? and mailid=? ",[ req.body.otp, req.body.mailid],function (error, result) {
          if(error)
            {
             res.status(403).json({ message: 'Enter correct mailid and otp...', status: false })
            }
            else{
                pool.query('update otpverify set otp=NULL where mailid=?',[req.body.mailid],function(error,result){
                  try{
                    if(error)
                      {
                       res.status(400).json({ message: 'Database error please contact with backendteam...', status: false })
                      }
                      else{
                       console.log('Otp Null verify',result)
                       res.status(200).json({ message: 'Otp Null verify', status: true })
                      }
                  }catch(e)
                  {
                    res.status(500).json({ message: 'Severe error on server please contact with backendteam..', status: false })
                  }
                })
            }

        })
      }
      catch(e)
      {
        res.status(500).json({ message: 'Severe error on server please contact with backendteam...', status: false })
      }
})


router.post('/submit_form',function(req,res,next){
  try{

    bcrypt.hash(req.body.newpassword, 10, function(err, hash) {
      console.log("Hashed Password:", hash);

    pool.query("insert into signup (firstname, lastname, mailid, phoneno, newpassword, confirmpassword) values(?,?,?,?,?,?)", [req.body.firstname, req.body.lastname, req.body.mailid, req.body.phoneno, hash, hash],function (error, result) {
      if (error) 
        {
        res.status(403).json({ message: 'Database error please contact with backend team...at submit form', status: false })
      }
      else {
          console.log(result[0]);
          res.status(200).json({ message: 'Sign-up successfully ....', status: true, data: result[0] })
      }
    })
  })
  }
  catch(e)
  {
      res.status(500).json({message:'Server error on server....at submit time'+e})
        /* pool.query('update signup set token=? where mailid=?',[randomToken,req.body.mailid],function(error,result){
            if(error){
              res.status(403).json({ message: 'Error...', status: false })
            }

          })*/
  }
  
})


module.exports = router;  