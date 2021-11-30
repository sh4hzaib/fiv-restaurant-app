import connectionPromise from '../../connection.js';
/**
 *  Registe to Database!
 * @desc   Register a user
 * @route  POST /register
 * @access Public
 */

export const registerUser = async (username,email,password) => {
    let connection = await connectionPromise;
    
     await connection.run(
        `INSERT INTO utilisateur(id_type_utilisateur, username,email, password)
        VALUES(?, ?,?, ?)`,
        [1,username,email,password]
    );
}

/**

 * @desc   Get Users
 * @route  POST /register
 * @access Public
 */

 export const GetUsers = async () => {
    let connection = await connectionPromise;
    
    let results = await connection.all(
        `SELECT * FROM utilisateur `
    );
    return results;
}

/**

 * @desc   Get Users
 * @route  POST /register
 * @access Public
 */

 export const SingleUser = async (username) => {
    let connection = await connectionPromise;
    
    let results = await connection.all(
        `SELECT * FROM utilisateur WHERE username =?`,[username]
    );
    return results;
}