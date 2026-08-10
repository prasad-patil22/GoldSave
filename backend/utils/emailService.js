import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create nodemailer transporter
let transporter;

const isEmailConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    service: process.env.SMTP_SERVICE || undefined,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('Nodemailer transporter initialized.');
} else {
  console.log('Nodemailer SMTP details missing. Emails will be logged to the console.');
}

const sendMail = async (options) => {
  const mailOptions = {
    from: `"Ganesh Jewellers" <${process.env.SMTP_USER || 'no-reply@ganeshjewellers.com'}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  if (isEmailConfigured) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${options.to} - Subject: ${options.subject}`);
    } catch (error) {
      console.error(`Email delivery failure to ${options.to}:`, error.message);
    }
  } else {
    console.log('\n=================== MOCK EMAIL SENT ===================');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Content:\n${options.html.replace(/<[^>]*>/g, ' ').substring(0, 500)}...`);
    console.log('=======================================================\n');
  }
};

// Premium Gold Email HTML template wrapper
const getEmailTemplate = (title, contentHtml) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; color: #333333; margin: 0; padding: 20px; }
    .card { background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border: 1px solid #e5c07b; }
    .header { background: linear-gradient(135deg, #AA771C 0%, #F3E5AB 50%, #D4AF37 100%); padding: 30px; text-align: center; color: #1a1a1a; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 1px 1px rgba(255,255,255,0.4); }
    .content { padding: 30px; line-height: 1.6; }
    .footer { background-color: #1a1a1a; color: #cccccc; padding: 20px; text-align: center; font-size: 12px; }
    .footer a { color: #D4AF37; text-decoration: none; }
    .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #AA771C, #D4AF37); color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Ganesh Jewellers</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${contentHtml}
    </div>
    <div class="footer">
      <p>This is an automated notification from Ganesh Jewellers Save Gold System.</p>
      <p>&copy; 2026 Ganesh Jewellers. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendWelcomeEmail = async (user) => {
  const html = getEmailTemplate(
    'Welcome to Ganesh Jewellers Save Gold Scheme!',
    `<p>Dear ${user.name},</p>
     <p>Thank you for registering an account on our online ledger system! Your customer ID is <strong>${user.customerId}</strong>.</p>
     <p>You can now log in, request money deposits, and keep track of your gold scheme savings balance anytime, anywhere.</p>
     <p>Login to your portal using your email (${user.email}) or mobile number (${user.mobile}).</p>
     <a href="${process.env.FRONTEND_URL}/login" class="btn">Access Dashboard</a>`
  );
  await sendMail({ to: user.email, subject: 'Welcome to Ganesh Jewellers Save Gold!', html });
};

export const sendAdminCreatedCustomerEmail = async (user, tempPassword) => {
  const html = getEmailTemplate(
    'Your Save Gold Account is Created',
    `<p>Dear ${user.name},</p>
     <p>Our administrator has created your ledger savings account. Your Customer ID is <strong>${user.customerId}</strong>.</p>
     <p>Please log in using the details below:</p>
     <ul>
       <li><strong>Email:</strong> ${user.email}</li>
       <li><strong>Mobile:</strong> ${user.mobile}</li>
       <li><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 16px; background-color: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</span></li>
     </ul>
     <p><strong>Security Notice:</strong> You will be forced to change your password immediately upon your first login for security reasons.</p>
     <a href="${process.env.FRONTEND_URL}/login" class="btn">Log In & Update Password</a>`
  );
  await sendMail({ to: user.email, subject: 'Save Gold Account Created - Ganesh Jewellers', html });
};

export const sendDepositApprovedEmail = async (user, transaction) => {
  const karat = transaction.goldKarat || '24K';
  const html = getEmailTemplate(
    'Deposit Successfully Added',
    `<p>Hello ${user.name},</p>
     <p>Your deposit has been successfully added.</p>
     <table style="width: 100%; max-width: 400px; border-collapse: collapse; margin: 20px 0;">
       <tr>
         <td style="padding: 8px 0; font-weight: bold; color: #555;">Deposit Amount:</td>
         <td style="padding: 8px 0; font-weight: bold;">₹${transaction.amount.toLocaleString('en-IN')}</td>
       </tr>
       <tr>
         <td style="padding: 8px 0; color: #555;">Gold Purity (Karat):</td>
         <td style="padding: 8px 0; font-weight: bold; color: #AA771C;">${karat}</td>
       </tr>
       <tr>
         <td style="padding: 8px 0; color: #555;">Gold Price:</td>
         <td style="padding: 8px 0; font-weight: bold;">₹${(transaction.goldPrice || 0).toLocaleString('en-IN')} per gram</td>
       </tr>
       <tr>
         <td style="padding: 8px 0; color: #555;">Gold Purchased:</td>
         <td style="padding: 8px 0; font-weight: bold; color: #AA771C;">${(transaction.goldPurchased || 0).toFixed(4)} g</td>
       </tr>
       <tr>
         <td style="padding: 8px 0; border-top: 1px solid #ddd; font-weight: bold; color: #555;">Total Gold Saved:</td>
         <td style="padding: 8px 0; border-top: 1px solid #ddd; font-weight: bold; color: #AA771C;">${(user.totalGold || 0).toFixed(4)} g (22K: ${(user.totalGold22k || 0).toFixed(4)} g, 24K: ${(user.totalGold24k || 0).toFixed(4)} g)</td>
       </tr>
     </table>
     <p>Thank you for saving with Ganesh Jewellers.</p>
     <a href="${process.env.FRONTEND_URL}/login" class="btn">Check Dashboard</a>`
  );
  await sendMail({ to: user.email, subject: `Deposit Approved: ₹${transaction.amount} - Ganesh Jewellers`, html });
};

export const sendDepositRejectedEmail = async (user, depositRequest) => {
  const html = getEmailTemplate(
    'Deposit Request Rejected',
    `<p>Dear ${user.name},</p>
     <p>We regret to inform you that your online deposit request of <strong>₹${depositRequest.amount}</strong> has been rejected for the following reason:</p>
     <p style="background-color: #fff0f0; border-left: 4px solid #ff4d4f; padding: 12px; font-style: italic;">"${depositRequest.rejectionReason || 'Details not specified. Please contact our support.'}"</p>
     <ul>
       <li><strong>Deposit Request Ref:</strong> ${depositRequest.transactionNumber}</li>
       <li><strong>Bank Transaction ID:</strong> ${depositRequest.transactionId || 'N/A'}</li>
       <li><strong>Payment Method:</strong> ${depositRequest.paymentMethod}</li>
       <li><strong>Date:</strong> ${depositRequest.date}</li>
     </ul>
     <p>Please double-check your payment screenshot and bank details, and submit a new deposit request if necessary.</p>
     <a href="${process.env.FRONTEND_URL}/login" class="btn">Submit New Deposit</a>`
  );
  await sendMail({ to: user.email, subject: `Deposit Rejected: ₹${depositRequest.amount} - Ganesh Jewellers`, html });
};

export const sendWithdrawalRecordedEmail = async (user, transaction) => {
  const karat = transaction.goldKarat || '24K';
  const html = getEmailTemplate(
    'Savings Withdrawal Recorded',
    `<p>Dear ${user.name},</p>
     <p>A withdrawal transaction of <strong>₹${transaction.amount.toLocaleString('en-IN')}</strong> has been recorded against your savings ledger for a jewellery purchase.</p>
     <ul>
       <li><strong>Transaction Number:</strong> ${transaction.transactionNumber}</li>
       <li><strong>Karat Type:</strong> ${karat}</li>
       <li><strong>Gold Deducted:</strong> ${(transaction.goldPurchased || 0).toFixed(4)} g</li>
       <li><strong>Invoice Number:</strong> ${transaction.invoiceNumber || 'N/A'}</li>
       <li><strong>Reason:</strong> ${transaction.reason}</li>
       <li><strong>Total Gold Saved:</strong> ${(user.totalGold || 0).toFixed(4)} g (22K: ${(user.totalGold22k || 0).toFixed(4)} g, 24K: ${(user.totalGold24k || 0).toFixed(4)} g)</li>
       <li><strong>Estimated Portfolio Value:</strong> ₹${user.balance.toLocaleString('en-IN')}</li>
       <li><strong>Date/Time:</strong> ${transaction.date} ${transaction.time}</li>
     </ul>
     <p>Thank you for shopping with Ganesh Jewellers! If you did not make this purchase, please contact us immediately.</p>
     <a href="${process.env.FRONTEND_URL}/login" class="btn">View Ledger Statement</a>`
  );
  await sendMail({ to: user.email, subject: `Ledger Deducted: ₹${transaction.amount} - Ganesh Jewellers`, html });
};


export const sendForgotPasswordEmail = async (user, tempCode) => {
  const html = getEmailTemplate(
    'Temporary Password Code',
    `<p>Dear ${user.name},</p>
     <p>We received a request to reset the password for your Ganesh Jewellers Save Gold account.</p>
     <p>A temporary password code has been generated for your account. You can log in using this code, and you will be prompted to set a new password immediately.</p>
     <p style="text-align: center; margin: 25px 0;">
       <span style="font-family: monospace; font-size: 20px; font-weight: bold; background-color: #f5f5f5; border: 1px dashed #AA771C; padding: 12px 24px; border-radius: 6px; letter-spacing: 1px; color: #AA771C;">${tempCode}</span>
     </p>
     <p>Click the button below to go to the login page:</p>
     <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Log In with Temporary Code</a>
     <p>If you did not request a password reset, please ignore this email.</p>`
  );
  await sendMail({ to: user.email, subject: 'Temporary Password Code - Ganesh Jewellers', html });
};

export const sendPasswordResetSuccessEmail = async (user) => {
  const html = getEmailTemplate(
    'Password Reset Successful',
    `<p>Dear ${user.name},</p>
     <p>The password for your Save Gold account has been successfully reset.</p>
     <p>If you did not perform this change, please lock your account and contact administrator immediately.</p>
     <a href="${process.env.FRONTEND_URL}/login" class="btn">Log In</a>`
  );
  await sendMail({ to: user.email, subject: 'Password Reset Successful - Ganesh Jewellers', html });
};
