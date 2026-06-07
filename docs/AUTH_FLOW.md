# Auth Flow

The login page is `/login` with two tabs: Parent/Teacher/Organization and Student (Learner). Parent/teacher login uses email or phone plus password. Learner login uses username or name plus 6-digit PIN.

Tokens are held in Svelte memory stores only. Refresh tokens are intended for httpOnly secure cookies. Passwords and PINs use bcrypt cost 12, with PIN peppering before hashing in production implementation.


## Teacher / Organization signup

The `/register` page asks for either `Teacher / Organization` or `Parent`. The Teacher / Organization path supports individual teachers, schools, tuition centres, NGOs, and learning organizations. Organizations submit organization name, type, contact person, registration or authorization document, subjects, age groups, county, phone, M-Pesa payout phone, and OTP. Both teacher and organization accounts enter the same admin approval queue before publishing classes.
