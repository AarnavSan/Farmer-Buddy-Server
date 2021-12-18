const uuid = require('uuid');
const express = require('express');
const app = express();
const path = require('path');
var port = process.env.PORT || 3000;

const encrypt = require('./user_modules/encryption');
const pool = require('./user_modules/sqlpool').pool;
const { error, Console } = require('console');

const emailRegSQL = 'INSERT INTO app_user(user_uuid,first_name,last_name,email,user_password,salt,bdate,sex,occupation,time_of_creation) VALUES';
const phoneRegSQL = 'INSERT INTO app_user(user_uuid,first_name,last_name,phone_number,user_password,salt,bdate,sex,occupation,time_of_creation) VALUES';
const bothRegSQL = 'INSERT INTO app_user(user_uuid,first_name,last_name,email,phone_number,user_password,salt,bdate,sex,occupation,time_of_creation) VALUES';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(__dirname + '/static/stylesheets'));

var asyncSqlFunc = function (data) {
    return new Promise((resolve, reject) => {
        pool.query(data[0], data[1], function (err, results) {
            if (err) {
                console.log("SQL ERORR");
                console.log(err);
                return reject(err);
            }
            else {
                return resolve(results[0]);
            }
        })
    });
}

//async function for checking duplicate registrations
//and registering users

async function checkingForUserQueries(email, phone_number, p, res, next) {
    var userExists = false;
    try {
        //Checking to see if user exists
        if (email) {
            let temp;
            temp = await asyncSqlFunc(['SELECT email FROM app_user where email=? LIMIT 1;', email]);
            if (temp) {
                userExists = true;
            }
            console.log(temp);
        }
        else {
            var temp = await asyncSqlFunc(['SELECT phone_number FROM app_user where phone_number=? LIMIT 1;', phone_number]);
            if (temp) {
                userExists = true;
            }
            console.log(temp);
        }

        console.log(userExists);

        //if user doesnt exist, register account
        if (userExists == false) {
            if (phone_number != undefined && email != undefined) {
                // var p = [uid, fname, lname, email, phone_number, password, salt, bdate, sex, occupation];
                pool.query(bothRegSQL + '(?,?,?,?,?,?,?,?,?,?,NOW());', p,
                    function (err, result, fields) {
                        if (err) {
                            console.log('[MySQL ERROR]', err);
                            res.json('Register Error: ', err);
                            next();
                        }
                        res.json(p);
                    });
            }
            else if (email != undefined) {
                // var p = [uid, fname, lname, email, password, salt, bdate, sex, occupation];
                pool.query(emailRegSQL + '(?,?,?,?,?,?,?,?,?,NOW());', p,
                    function (err, result, fields) {
                        if (err) {
                            console.log('[MySQL ERROR]', err);
                            res.json('Register Error: ', err);
                        }
                        res.json(p);
                    });
            }
            else {
                // var p = [uid, fname, lname, phone_number, password, salt, bdate, sex, occupation];
                pool.query(phoneRegSQL + '(?,?,?,?,?,?,?,?,?,NOW());', p,
                    function (err, result, fields) {
                        if (err) {
                            console.log('[MySQL ERROR]', err);
                            res.json('Register Error: ', err);
                        }
                        res.json(p);
                    });
            }
        }
        else {
            res.json('User Already Exists');
        }
    }
    catch (err) {
        console.log(err);
        res.end(JSON.stringify("Server Error"));
        next();
    }
}

//Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/static/index.html'));
})

//REGISTRATION POST API
app.post('/register', (req, res, next) => {
    try {
        console.log('Registering');
        var post_data = req.body;
        var uid = uuid.v4();
        var plaint_password = post_data.password;
        var hash_data = encrypt.saltHashPassword(plaint_password);
        var password = hash_data.passwordHash;
        var salt = hash_data.salt;

        var fname = post_data.fname;
        var lname = post_data.lname;
        var email = post_data.email;
        var phone_number = post_data.phone_number;
        var bdate = post_data.bdate;
        var sex = post_data.sex;
        var occupation = post_data.occupation;

        if (email && phone_number) {
            var p = [uid, fname, lname, email, phone_number, password, salt, bdate, sex, occupation];
        }
        else if (email) {
            var p = [uid, fname, lname, email, password, salt, bdate, sex, occupation];
        }
        else {
            var p = [uid, fname, lname, phone_number, password, salt, bdate, sex, occupation];
        }

        checkingForUserQueries(email, phone_number, p, res, next);
    }
    catch {
        res.end(JSON.stringify("Server Error"));
        next();
    }
});

//LOGIN POST API
app.post('/login', (req, res, next) => {
    console.log('Logging');
    login(req, res, next);
});

app.post('/resetpass', (req, res, next) => {
    resetPass(req, res, next);
})

async function resetPass(req, res, next) {
    try {
        var email = req.body.email;
        var phone_number = req.body.phone_number;
        var uid = req.body.uid;
        var new_password = req.body.new_password;
        var updateSql = "UPDATE app_user SET user_password = ?, salt = ? WHERE ";
        var emailUpdatesql = "email = ?;";
        var phoneUpdatesql = "phone_number = ?;";
        var hash_data = encrypt.saltHashPassword(new_password);
        var new_encrypted_password = hash_data.passwordHash;
        var salt = hash_data.salt;
        var response = await getUserPass(req);
        console.log(response);
        console.log(old_password);
        if (response) {
            console.log("Verifying")
            if (uid == response.user_uuid) {
                console.log("Verified true");
            }
            else {
                res.json(JSON.stringify('Wrong unique id'));
                next();
            }

        }
        else {
            res.json(JSON.stringify("User does not exist"));
            next();
        }
        console.log("verification over");
        if (email) {
            var response = await asyncSqlFunc([updateSql + emailUpdatesql, [new_encrypted_password, salt, email]]);
            res.end(JSON.stringify('Password Changed to New Password'));
        }
        else {
            var response = await asyncSqlFunc([updateSql + phoneUpdatesql, [new_encrypted_password, salt, phone_number]]);
            res.end(JSON.stringify('Password Changed to New Password'));
        }
    }
    catch {
        res.end(JSON.stringify("Server Error"));
        next();
    }
}

async function login(req, res, next) {
    try {
        var response = await getUserPass(req);
        if (response) {
            if (comparePass(req.body.password, response.salt, response.user_password))
                // res.end(JSON.stringify(response));
                res.end(JSON.stringify(1));
            else {
                res.end(JSON.stringify(0));
                next();
            }

        }
        else {
            res.end(JSON.stringify("User does not exist"));
            next();
        }
    }
    catch {
        res.end(JSON.stringify("Server Error"));
        next();
    }
}

function comparePass(user_password, salt, sqlpass) {
    var encrypted_password = sqlpass;
    console.log(user_password);
    console.log(salt);
    var hashed_password = encrypt.checkHashPassword(user_password.toString(), salt.toString()).passwordHash;
    console.log(hashed_password);
    console.log(encrypted_password);
    return encrypted_password == hashed_password;
}

async function getUserPass(req) {
    try {
        var post_data = req.body;

        if (post_data.email != undefined) {
            var email = post_data.email;
            var temp = await asyncSqlFunc(['SELECT * FROM app_user where email = ?;', [email]]);
            if (temp == error) {
                console.log(error);
            }
            else return temp;
        }
        else {
            var phone_number = post_data.phone_number;
            var temp = await asyncSqlFunc(['SELECT * FROM app_user where phone_number = ?;', [phone_number]]);
            if (temp == error) {
                console.log(error);
            }
            else return temp;
        }
    }
    catch {
        res.end(JSON.stringify("Server Error"));
        next();
    }
}

//Listening on Port
app.listen(port, () => {
    // console.log("Running on port =" + port);
    console.log(`Running on port = ${port}`);
})