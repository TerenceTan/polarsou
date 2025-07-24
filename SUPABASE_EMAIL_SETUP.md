# Supabase Email Configuration for polarsou

## Custom Email Templates and SMTP Setup

### 1. Custom SMTP Configuration

To use a custom email sender and avoid localhost links, configure SMTP in Supabase:

1. **Go to Supabase Dashboard**
   - Navigate to your project dashboard
   - Go to `Settings` > `Authentication`

2. **Configure SMTP Settings**
   - Scroll down to "SMTP Settings"
   - Enable "Enable custom SMTP"
   - Configure the following:

```
SMTP Host: smtp.gmail.com (or your email provider)
SMTP Port: 587
SMTP User: noreply@polarsou.com (your email)
SMTP Pass: your-app-password
Sender Name: polarsou
Sender Email: noreply@polarsou.com
```

### 2. Custom Email Templates

#### Confirmation Email Template

Go to `Authentication` > `Email Templates` > `Confirm signup`:

**Subject:** Welcome to polarsou! Please confirm your email

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to polarsou</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333; margin-top: 0; font-size: 24px; }
        .content p { margin: 16px 0; font-size: 16px; line-height: 1.6; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .button:hover { opacity: 0.9; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { margin: 0; color: #6c757d; font-size: 14px; }
        .features { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .features h3 { margin-top: 0; color: #495057; }
        .features ul { margin: 0; padding-left: 20px; }
        .features li { margin: 8px 0; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🇲🇾 Welcome to polarsou!</h1>
            <p>Malaysia's easiest bill splitting app</p>
        </div>
        
        <div class="content">
            <h2>Confirm Your Email Address</h2>
            <p>Hi there! 👋</p>
            <p>Thanks for joining polarsou! We're excited to help you split bills easily with friends and family across Malaysia.</p>
            
            <p>Please click the button below to confirm your email address and activate your account:</p>
            
            <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
            
            <div class="features">
                <h3>🎉 What you can do with polarsou:</h3>
                <ul>
                    <li>✅ Smart bill splitting with Malaysian SST (6%) calculations</li>
                    <li>✅ TouchNGo, GrabPay, and DuitNow QR payment integration</li>
                    <li>✅ Receipt OCR scanning to auto-extract bill items</li>
                    <li>✅ Mobile-optimized for Malaysian users</li>
                    <li>✅ Share sessions with friends via QR codes</li>
                    <li>✅ Works offline with local storage backup</li>
                </ul>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{{ .ConfirmationURL }}</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
        </div>
        
        <div class="footer">
            <p>© 2025 polarsou. Making bill splitting easy for Malaysian users.</p>
            <p>If you didn't create an account with us, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
```

#### Password Recovery Email Template

Go to `Authentication` > `Email Templates` > `Reset password`:

**Subject:** Reset your polarsou password

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your polarsou Password</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333; margin-top: 0; font-size: 24px; }
        .content p { margin: 16px 0; font-size: 16px; line-height: 1.6; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { margin: 0; color: #6c757d; font-size: 14px; }
        .security-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset</h1>
        </div>
        
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi there!</p>
            <p>We received a request to reset the password for your polarsou account.</p>
            
            <p>Click the button below to create a new password:</p>
            
            <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
            
            <div class="security-note">
                <strong>🛡️ Security Note:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, you can safely ignore this email.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{{ .ConfirmationURL }}</p>
        </div>
        
        <div class="footer">
            <p>© 2025 polarsou. Making bill splitting easy for Malaysian users.</p>
        </div>
    </div>
</body>
</html>
```

### 3. Site URL Configuration

To fix localhost links in emails:

1. **Go to Authentication Settings**
2. **Update Site URL:**
   - Set to your production domain: `https://polarsou.com`
   - Or your actual domain: `https://yourdomain.com`

3. **Add Redirect URLs:**
   - Add your production domain to allowed redirect URLs
   - Format: `https://polarsou.com/**`

### 4. Environment Variables

Update your `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=https://polarsou.com
```

### 5. Testing Email Configuration

1. **Test Signup Flow:**
   - Create a new account
   - Check email delivery and formatting
   - Verify confirmation link works

2. **Test Password Reset:**
   - Use "Forgot Password" feature
   - Check email delivery
   - Verify reset link works

### 6. Email Provider Recommendations

#### For Production Use:

1. **SendGrid** (Recommended)
   - Reliable delivery
   - Good reputation
   - Easy setup with Supabase

2. **Mailgun**
   - Developer-friendly
   - Good analytics
   - Competitive pricing

3. **Amazon SES**
   - Cost-effective
   - High deliverability
   - Requires AWS setup

#### SMTP Configuration Examples:

**SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Pass: your-sendgrid-api-key
```

**Mailgun:**
```
Host: smtp.mailgun.org
Port: 587
User: postmaster@mg.yourdomain.com
Pass: your-mailgun-password
```

### 7. Domain Setup (Optional)

For professional emails:

1. **Set up custom domain**
2. **Configure DNS records**
3. **Verify domain ownership**
4. **Update SMTP settings**

This ensures emails come from `noreply@polarsou.com` instead of generic addresses.

---

**Note:** After configuring SMTP and templates, test thoroughly before going live. Email deliverability is crucial for user experience.

