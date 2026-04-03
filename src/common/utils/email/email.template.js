export const emailTemplate = (userName, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Saraha – You have a new anonymous message</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── Reset ── */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

        body {
          font-family: 'DM Sans', Helvetica, Arial, sans-serif;
          background-color: #0e0b1a;
          color: #e8e0f5;
        }

        /* ── Wrapper ── */
        .wrapper {
          width: 100%;
          background-color: #0e0b1a;
          padding: 48px 16px;
        }

        /* ── Card ── */
        .card {
          max-width: 560px;
          margin: 0 auto;
          background: linear-gradient(160deg, #1a1430 0%, #120e26 100%);
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(162, 117, 255, 0.18);
          box-shadow:
            0 0 0 1px rgba(162, 117, 255, 0.08),
            0 32px 64px rgba(0, 0, 0, 0.6),
            0 0 80px rgba(120, 60, 220, 0.12);
        }

        /* ── Header strip ── */
        .header {
          background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #a855f7 100%);
          padding: 40px 40px 32px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: -60px; left: -60px;
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.07);
          border-radius: 50%;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -80px; right: -40px;
          width: 260px; height: 260px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }

        .logo-icon {
          display: inline-block;
          width: 56px; height: 56px;
          background: rgba(255,255,255,0.15);
          border-radius: 16px;
          line-height: 56px;
          font-size: 28px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .logo-wordmark {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.5px;
          position: relative;
          z-index: 1;
          display: block;
        }

        .header-tagline {
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          font-weight: 300;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 6px;
          position: relative;
          z-index: 1;
        }

        /* ── Body ── */
        .body {
          padding: 40px 40px 32px;
        }

        .greeting {
          font-size: 13px;
          color: rgba(162, 117, 255, 0.8);
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #f0eaff;
          line-height: 1.3;
          margin-bottom: 28px;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(162,117,255,0.3), transparent);
          margin: 0 0 28px;
        }

        /* ── Message bubble ── */
        .message-bubble {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(162, 117, 255, 0.2);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 32px;
          position: relative;
        }

        .message-bubble::before {
          content: '';
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 72px;
          color: rgba(162, 117, 255, 0.2);
          position: absolute;
          top: -12px;
          left: 16px;
          line-height: 1;
        }

        .message-text {
          font-size: 17px;
          line-height: 1.75;
          color: #ddd6f3;
          font-weight: 300;
          padding-top: 16px;

          /* ← PLACEHOLDER: replace with actual message content */
        }

        .anonymous-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(162, 117, 255, 0.12);
          border: 1px solid rgba(162, 117, 255, 0.22);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 12px;
          color: rgba(162, 117, 255, 0.9);
          font-weight: 500;
          letter-spacing: 0.5px;
          margin-top: 18px;
        }

        /* ── Footer ── */
        .footer {
          background: rgba(0,0,0,0.25);
          border-top: 1px solid rgba(162, 117, 255, 0.1);
          padding: 28px 40px;
          text-align: center;
        }

        .footer p {
          font-size: 12px;
          color: rgba(200, 190, 230, 0.4);
          line-height: 1.8;
        }

        /* ── Responsive ── */
        @media only screen and (max-width: 600px) {
          .header, .body, .footer { padding-left: 24px !important; padding-right: 24px !important; }
          .headline { font-size: 22px; }
          .message-text { font-size: 15px; }
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td>
              <div class="card">

                <!-- ── Header ── -->
                <div class="header">
                  <div class="logo-icon">💬</div>
                  <span class="logo-wordmark">Saraha</span>
                  <p class="header-tagline">Anonymous Messaging</p>
                </div>

                <!-- ── Body ── -->
                <div class="body">
                  <p class="greeting">Hello, ${userName} 👋</p>
                  <h1 class="headline">Someone sent you<br/>an anonymous message</h1>
                  <div class="divider"></div>

                  <!-- Message Bubble -->
                  <div class="message-bubble">
                    <p class="message-text">
                      Your OTP code is: <strong>${otp}</strong><br/><br/>
                      Use this code to verify your email and access your Saraha dashboard, where you can read all your anonymous messages and manage your account settings.
                    </p>
                    <div class="anonymous-badge">
                      🕵️ Sent anonymously
                    </div>
                  </div>


                <!-- ── Footer ── -->
                <div class="footer">
                  <p>
                    You're receiving this because someone visited your Saraha link.<br/>
                    Sender identity is never revealed by Saraha.
                  </p>
                 </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
};
