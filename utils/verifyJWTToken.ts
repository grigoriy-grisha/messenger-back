import jwt, { VerifyErrors } from "jsonwebtoken";
// import { IUser } from "../models/User";
import config from 'config'
export interface DecodedData {
  data: string
}

export default (token: string): Promise<DecodedData | null> =>

  new Promise(
    (
      resolve: (decodedData: DecodedData) => void,
      reject: (err: VerifyErrors) => void
    ) => {
      console.log(token);
      console.log();
      
      jwt.verify(
        token,
        config.get('jwtSecret'),
        (err: any, decodedData) => {
          if (err || !decodedData) {
            return reject(err);
          }
          
          
          resolve(decodedData as DecodedData);
        }
      )
    }
  );
