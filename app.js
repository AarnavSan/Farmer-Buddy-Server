const crypto = require('crypto');
const uuid = require('uuid');
const express = require('express');
const app = express();
var port = process.env.PORT || 3000;

const encrypt = require('./user_modules/encryption');
const pool = require('./user_modules/sqlpool').pool;

const emailRegSQL = 'INSERT INTO app_user(user_uuid,first_name,last_name,email,user_password,salt,bdate,sex,occupation,time_of_creation) VALUES';
const phoneRegSQL = 'INSERT INTO app_user(user_uuid,first_name,last_name,phone_number,user_password,salt,bdate,sex,occupation,time_of_creation) VALUES';
const bothRegSQL = 'INSERT INTO app_user(user_uuid,first_name,last_name,email,phone_number,user_password,salt,bdate,sex,occupation,time_of_creation) VALUES';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var checkForUser = function(data){
    return new Promise((resolve, reject)=>{
        pool.query(data[0], data[1], function(err,results){
            if(err)
            {
                console.log("SQL ERORR");
                console.log(err);
                return reject(err);
            }
            else{
               return resolve(results[0]);
            }
        })
    });
}

//Home page
app.get('/',(req,res)=>{
    res.send("Use /register and /login for api calls!");
})

//Registration POST API
app.post('/register', (req, res, next) => {
    console.log('Registering');
    var post_data = req.body;
    var uid = uuid.v4();
    var plaint_password = post_data.password;
    var hash_data = encrypt.saltHashPassword(plaint_password);
    var password = hash_data.passwordHash;
    var salt = hash_data.salt;

    var fname = post_data.fname;
    var lname = post_data.lname;
    var email = post_data.email ;
    var phone_number = post_data.phone_number;
    var bdate = post_data.bdate;
    var sex = post_data.sex;
    var occupation = post_data.occupation;

    var userExists = false;

    async function checkingForUserQueries(){
    try
    {
    //Checking to see if user exists
    if(email){
        let temp;
        temp = await checkForUser(['SELECT email FROM app_user where email=? LIMIT 1;',email]);
        if(temp){
            userExists = true;
        }
        console.log(temp);
    }
    else{
        var temp = await checkForUser(['SELECT phone_number FROM app_user where phone_number=? LIMIT 1;',phone_number]);
        if(temp){
            userExists = true;
        }
        console.log(temp);
    }

    console.log(userExists);  

    //if user doesnt exist, register account
    if(userExists == false)
    {
        if(phone_number!=undefined && email!=undefined)
        {
            var p = [uid, fname, lname, email, phone_number, password, salt, bdate, sex, occupation];
            pool.query(bothRegSQL + '(?,?,?,?,?,?,?,?,?,?,NOW());', p,
                function (err, result, fields) {
                    if(err) {
                        console.log('[MySQL ERROR]', err);
                        res.json('Register Error: ', err);
                    }
                    res.json(p);
                });
        }
        else if(email!=undefined)
        {
            var p = [uid, fname, lname, email, password, salt, bdate, sex, occupation];
            pool.query(emailRegSQL + '(?,?,?,?,?,?,?,?,?,NOW());', p,
                function (err, result, fields) {
                    if(err) {
                        console.log('[MySQL ERROR]', err);
                        res.json('Register Error: ', err);
                    }
                    res.json(p);
                });
        }
        else{
            var p = [uid, fname, lname, phone_number, password, salt, bdate, sex, occupation];
            pool.query(phoneRegSQL + '(?,?,?,?,?,?,?,?,?,NOW());', p,
                function (err, result, fields) {
                    if(err) {
                        console.log('[MySQL ERROR]', err);
                        res.json('Register Error: ', err);
                    }
                    res.json(p);
                });
        }
    }
    else{
        res.json('User Already Exists');
    }
    }
    catch(err){
        console.log(err);
    }
}

    checkingForUserQueries();
});

//LOGIN POST API
app.post('/login',(req,res,next)=>{
    console.log('Logging');
    var post_data = req.body;
    var user_password = post_data.password;
    if(post_data.email!=undefined)
    {
        var email =  post_data.email;
        pool.query('SELECT user_password,salt FROM app_user where email = ?;', [email], function (err, result, fields) {
            if(err){
                console.log(err);
            }

            else if (result && result.length){
                var salt = result[0].salt;
                var encrypted_password = result[0].user_password;
                var hashed_password = encrypt.checkHashPassword(user_password,salt).passwordHash;
                if(encrypted_password==hashed_password)
                    res.end(JSON.stringify(result[0]))
                else
                    res.end(JSON.stringify('Wrong Password'));
            }
            else {
                res.json('User Not Exists');
            }

        });
    }
    else{
        var phone_number = post_data.phone_number;
        pool.query('SELECT user_password,salt FROM app_user where phone_number = ?;', [phone_number], function (err, result, fields) {
            if(err){
                console.log(err);
            }

            else if (result && result.length){
                var salt = result[0].salt;
                var encrypted_password = result[0].user_password;
                var hashed_password = encrypt.checkHashPassword(user_password,salt).passwordHash;
                console.log(encrypted_password);
                console.log(hashed_password);
                if(encrypted_password==hashed_password)
                    res.end(JSON.stringify(result[0]))
                else
                    res.end(JSON.stringify('Wrong Password'));
            }
            else {
                res.json('User Not Exists');
            }
            });
        }
});

app.listen(port, () => {
    console.log(`Running on port = ${port}`);
})