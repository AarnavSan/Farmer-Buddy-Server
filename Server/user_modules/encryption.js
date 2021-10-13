const crypto = require('crypto');

//password util
function genRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

function sha512(password, salt) {
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};

function saltHashPassword(userPassword) {
    var salt = genRandomString(8);
    var passwordData = sha512(userPassword, salt);
    return passwordData;
};


function checkHashPassword(userPassword,salt){
    var passwordData = sha512(userPassword,salt);
    return passwordData;
}

module.exports = {
    genRandomString: genRandomString,
    sha512: sha512,
    saltHashPassword: saltHashPassword,
    checkHashPassword: checkHashPassword
}