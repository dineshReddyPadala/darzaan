import { passwordResetEmail, welcomeEmail } from '../libs/mail/src/templates';

describe('staff mail', () => {
  it('puts the login and temporary password in the welcome letter', () => {
    const letter = welcomeEmail({
      name: 'Asha <script>',
      email: 'asha@darzaan.test',
      password: 'TempPass#1',
      signInUrl: 'http://localhost:5173/login',
    });
    expect(letter.subject).toBe('Your Darzaan login');
    expect(letter.text).toContain('asha@darzaan.test');
    expect(letter.text).toContain('TempPass#1');
    expect(letter.html).toContain('Asha &lt;script&gt;');
    expect(letter.html).not.toContain('<script>');
    expect(letter.html).toContain('choose your own');
  });

  it('includes a one-hour reset link', () => {
    const letter = passwordResetEmail({ name: 'Asha', resetUrl: 'http://localhost:5173/reset-password?token=abc' });
    expect(letter.subject).toBe('Reset your Darzaan password');
    expect(letter.text).toContain('http://localhost:5173/reset-password?token=abc');
    expect(letter.text).toContain('one hour');
  });
});