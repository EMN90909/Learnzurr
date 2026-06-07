// This patch is intentionally disabled.
// Login.tsx now has the password-then-email-OTP flow implemented directly.
// Keeping the old mutation here caused duplicate otpCode and verifyEmailOtp declarations during prebuild.

console.log("[signin-otp-login-ui] skipped: Login.tsx already contains the current OTP flow.");
