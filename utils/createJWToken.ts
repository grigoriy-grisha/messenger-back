import jwt from "jsonwebtoken";
// import { reduce } from "lodash";
import config from 'config'

// interface ILoginData {
//   email: string;
//   password: string;
// }

export const createJWToken = (id: string) => {
  const token = jwt.sign(
    { data: id},
    config.get('jwtSecret'),
    { expiresIn: config.get('live'), }
  );

  return token;
};
