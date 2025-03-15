var express = require('express');
var router = express.Router();
var pool = require('./pool');
var { LocalStorage } = require("node-localstorage");
var localStorage = new LocalStorage('./scratch');
const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const verifyToken = require("./authMiddleware")

const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const passwordGenerator = require('generate-otp');
const { token } = require('morgan');
const { SMTP_MAIL, SMTP_PASSWORD } = process.env


const randomToken = passwordGenerator.generate(6);

const sendMail = async (mailid, mailSubject, content) => {
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

/*************************** Forgot password***************/

const forgotPassword = (req, res) => {

  var mailId = req.body.mailid;

  pool.query('select * from signup where mailid=? limit 1', [mailId], function (error, result, field) {
    if (error) {
      req.status(400).json({ message: error, status: false });
    }

    if (result.length > 0) {
      let verifcation = 'not verify'
      let mailSubject = 'Forget Password';
      let content = 'Hii ' + result[0].firstname + ' ' + result[0].lastname + ' token is  ' + randomToken + ' to  your reset password';
      sendMail(mailId, mailSubject, content);
      pool.query('insert into password_resets (mailid, token, verification) values(?,?,?)', [mailId, randomToken, verifcation], function (error, result) {
        if (error) {
          res.status(403).json({ message: 'Database error please contact with backendteam...', status: false })
        }
        else {
          res.status(200).send({ message: 'sent otp with new before reset Password' })
        }
      })
    }
    else {
      return req.status(401).send({ message: 'Mailid does not Exist....' })
    }

  })


}
/************************************************************************************ */

/* GET home page. */

router.get('/admin_login', function (req, res) {
  try {
    var admin = JSON.parse(localStorage.getItem('Admin'))
    if (admin == null)
      return res.status(403).json({ message: 'Logout unsuccessfull' });
    else {
      console.log(admin)
      return res.status(200).json({ data: admin, status: true, message: "Logout Successful..." })
    }
  }
  catch {
    return res.status(500).json({ message: 'Server error...' });
  }
});

/*
router.post("/check_login", function (req, res) {

  pool.query("select * from signup where mailid=?", [req.body.mailid], function (error, result) {
    if (error) {
      return res.status(403).json({ data: [], status: false, message: "Database error..password bali..." })
    }
    else{
      const user = result[0];
  bcrypt.compare(req.body.newpassword, user.hash, function (error, result) {
    if (error) {
      return res.status(403).json({ message: 'Password not matched' });
    }
    else {
      pool.query("select * from signup where mailid=? and newpassword=?", [req.body.mailid, req.body.newpassword], function (error, result) {
        if (error) {
          return res.status(403).json({ data: [], status: false, message: "Database error....." })
        }
        else {
          if (result.length == 1) {
            let jwtSecretKey = process.env.JWT_SECRET_KEY;
            localStorage.setItem('ADMIN', JSON.stringify(result[0]))
            const token = jwt.sign({ user: result[0] }, jwtSecretKey, {
              expiresIn: '1h',
            });
            res.status(200).json({ token, data: result[0], status: true })
          }
          else {
            res.status(500).json({ status: false })
          }
       
        }

      })
    }
  });
}
  })
})

*/

router.post("/check_login", function (req, res) {
  const { mailid, newpassword } = req.body;
  
  // Check if email exists in the database
  pool.query("SELECT * FROM signup WHERE mailid = ?", [mailid], function (error, results) {
    if (error) {
      return res.status(500).json({ status: false, message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ status: false, message: "Invalid email or password" });
    }

    const user = results[0];
    console.log('password5555555555555555555555555555555555',results[0].newpassword)
    // Compare password using bcrypt
    bcrypt.compare(newpassword, results[0].newpassword, function (err, isMatch) {
      if (err) {
        return res.status(500).json({ status: false, message: "Error verifying password" });
      }

      if (!isMatch) {
        return res.status(401).json({ status: false, message: "Invalid email or password" });
      }

      // Generate JWT token
      const jwtSecretKey = process.env.JWT_SECRET_KEY;
      const token = jwt.sign({ user: user }, jwtSecretKey, { expiresIn: "1h" });

      // Send response with token and user data
      return res.status(200).json({ token, data: user, status: true });
    });
  });
});




router.get('/admin_logout', function (req, res) {
  localStorage.clear()
  return res.status(200).redirect('/admins/admin_login')
})


router.post('/forget-password', function (req, res, next) {
  forgotPassword(req, res);
})


router.post('/verify_otp', function (req, res, next) {
  try {
    let verifcation = 'verify'
    pool.query("update password_resets set verification=? where token=? and mailid=?", [verifcation, req.body.otp, req.body.mailid], function (error, result) {
      if (error) {
        res.status(403).json({ message: 'Enter correct otp...', status: false })
      }
      else {
            pool.query('update password_resets set token=NULL where mailid=?',[req.body.mailid],function(error,result){
             
                if(error)
                  {
                   res.status(400).json({ message: 'Database error please contact with backendteam...', status: false })
                  }
                  else{
                   res.status(200).json({ message: 'Token Null and Otp verify', status: true })
                  }
                })  
      }
    })
  }
  catch (e) {
    res.status(500).json({ message: 'Severe error on server please contact with backendteam..', status: false })
  }

})


router.post('/reset-password', function (req, res) {
  try {
    const { newPassword, confirmPassword, mailid } = req.body;

    if (!newPassword || !confirmPassword || !mailid) {
      return res.status(400).json({ message: 'Missing required fields', status: false });
    }

    if (newPassword !== confirmPassword) {
      return res.status(403).json({ message: 'Passwords do not match', status: false });
    }

    bcrypt.hash(newPassword, 10, function (err, hash) {
      if (err) {
        return res.status(500).json({ message: 'Error hashing password', status: false });
      }
      console.log(hash)
      pool.query(
        'UPDATE admin.signup SET newpassword = ?, confirmpassword = ? WHERE mailid = ?',
        [hash, hash, mailid],
        function (error, result) {
          if (error) {
            return res.status(500).json({ message: error.message, status: false });
          }
          return res.status(200).json({ message: 'New password updated successfully', status: true });
        }
      );
    });
  } catch (e) {
    return res.status(500).json({ message: 'Server error, please contact the backend team', status: false });
  }
});




module.exports = router;


