// In production replace with Twilio Verify
const otpStore = new Map();

export async function sendOtpMock(phoneNumber) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phoneNumber, code);
  console.log(`Mock OTP for ${phoneNumber}: ${code}`);
  return code;
}

export async function verifyOtpMock(phoneNumber, otp) {
  const code = otpStore.get(phoneNumber);
  return code === otp;
}
