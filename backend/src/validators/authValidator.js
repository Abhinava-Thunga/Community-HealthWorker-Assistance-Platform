import validator from "validator";

export const validateSendOTP = (email) => {

    if (!email)
        return "Email is required";

    if (!validator.isEmail(email))
        return "Invalid Email";

    return null;
};

export const validateVerifyOTP = (email, otp) => {

    if (!email)
        return "Email is required";

    if (!validator.isEmail(email))
        return "Invalid Email";

    if (!otp)
        return "OTP is required";

    if (!/^\d{6}$/.test(otp))
        return "OTP must contain exactly 6 digits";

    return null;
};