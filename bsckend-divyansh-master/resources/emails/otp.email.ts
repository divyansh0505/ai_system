export type OtpEmail = {
  otp: string;
  recipient_name?: string;
};

export const otpEmailHtml = (data: OtpEmail) =>
  `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>InteractAI</title>

    <style>
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        height: 100% !important;
        width: 100% !important;
      }
      * {
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
        box-sizing: border-box;
      }
      table,
      td {
        mso-table-lspace: 0pt !important;
        mso-table-rspace: 0pt !important;
      }
      table {
        border-spacing: 0 !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
        margin: 0 auto !important;
      }
      img {
        -ms-interpolation-mode: bicubic;
        border: 0;
        outline: none;
        text-decoration: none;
        display: block;
        max-width: 100%;
        height: auto;
      }
      a {
        text-decoration: none;
      }

      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          max-width: 100% !important;
        }
        .px {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
        .card {
          padding: 32px 20px !important;
        }
        .title {
          font-size: 36px !important;
          line-height: 42px !important;
        }
        .subtitle {
          font-size: 18px !important;
          line-height: 26px !important;
        }
        .otp-code {
          font-size: 32px !important;
          letter-spacing: 8px !important;
        }
        .logo {
          width: 180px !important;
        }
        .footer-text {
          font-size: 14px !important;
          line-height: 22px !important;
        }
      }
    </style>
  </head>

  <body style="margin: 0; padding: 0; background-color: #f6f7f9;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f7f9;">
      <tr>
        <td align="center" style="padding: 24px 0 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" style="width: 94%; max-width: 600px;">
            <!-- TOP GREETING -->
            <tr>
              <td align="center" style="padding: 0 16px 16px;" class="px">
                <div
                  style="
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    line-height: 22px;
                    color: #8a8f98;
                    font-weight: 500;
                  "
                >
                  Hello${data.recipient_name ? ` ${data.recipient_name}` : ''} 👋
                </div>
              </td>
            </tr>

            <!-- LOGO -->
            <tr>
              <td align="center" style="padding: 0 16px 20px;" class="px">
                <img
                  src="https://s3.us-east-1.amazonaws.com/prod.assests.humanisys.ai/logo.png"
                  alt="InteractAI"
                  class="logo"
                  style="width: 200px; max-width: 200px; height: auto;"
                />
              </td>
            </tr>

            <!-- MAIN WHITE CARD -->
            <tr>
              <td align="center" style="padding: 0 16px 16px;" class="px">
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    background-color: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
                  "
                >
                  <tr>
                    <td
                      align="center"
                      class="card"
                      style="padding: 36px 24px 32px;"
                    >
                      <!-- Title -->
                      <div
                        class="title"
                        style="
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                          font-size: 42px;
                          line-height: 48px;
                          font-weight: 800;
                          color: #14122a;
                          letter-spacing: -0.5px;
                          margin: 0 0 12px;
                        "
                      >
                        Verification Code
                      </div>

                      <!-- Subtitle -->
                      <div
                        class="subtitle"
                        style="
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                          font-size: 18px;
                          line-height: 28px;
                          color: #5a5f6a;
                          margin: 0 0 24px;
                        "
                      >
                        Use the following code to verify your email address. This code will expire in 5 minutes.
                      </div>

                      <!-- OTP CODE -->
                      <div
                        class="otp-code"
                        style="
                          font-family: 'SF Mono', Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
                          font-size: 40px;
                          font-weight: 700;
                          letter-spacing: 12px;
                          color: #0b63f6;
                          background-color: #eef4fb;
                          padding: 20px 32px;
                          border-radius: 12px;
                          margin: 0 0 16px;
                        "
                      >
                        ${data.otp}
                      </div>

                      <!-- Warning -->
                      <div
                        style="
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                          font-size: 14px;
                          line-height: 20px;
                          color: #8a8f98;
                          margin: 0;
                        "
                      >
                        If you didn't request this code, please ignore this email.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="padding: 0 16px;" class="px">
                <div
                  class="footer-text"
                  style="
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: 13px;
                    line-height: 20px;
                    color: #8a8f98;
                    padding-top: 4px;
                  "
                >
                  This is an automated message from InteractAI. Please do not reply.
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
