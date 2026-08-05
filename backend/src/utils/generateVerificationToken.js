import { v4 as uuid } from "uuid";

const generateVerificationToken = () => {
  return uuid();
};

export default generateVerificationToken;