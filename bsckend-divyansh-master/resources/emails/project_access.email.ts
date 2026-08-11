export type ProjectAccessEmail = {
  project_title: string;
  organization_name: string;
  access_duration: string;
  project_link: string;
  recipient_name?: string;
};

export const projectAccessEmailHtml = (data: ProjectAccessEmail) =>
  `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>InteractAI</title>

    <style>
      /* CLIENT RESETS */
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

      /* MOBILE */
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
        .btn {
          padding: 14px 32px !important;
          font-size: 16px !important;
          min-width: auto !important;
          width: auto !important;
        }
        .logo {
          width: 180px !important;
        }
        .fallback-text {
          font-size: 14px !important;
          line-height: 22px !important;
        }
        .fallback-link {
          font-size: 14px !important;
          word-break: break-all !important;
        }
        .footer-text {
          font-size: 14px !important;
          line-height: 22px !important;
        }
      }
    </style>
  </head>

  <body style="margin: 0; padding: 0; background-color: #f6f7f9;">
    <!-- FULL WIDTH WRAPPER -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f7f9;">
      <tr>
        <td align="center" style="padding: 24px 0 32px;">
          <!-- MAIN CONTAINER - 94% width with max 600px for optimal readability -->
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
                        Voila!
                      </div>

                      <!-- Subtitle -->
                      <div
                        class="subtitle"
                        style="
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                          font-size: 18px;
                          line-height: 28px;
                          color: #5a5f6a;
                          margin: 0 0 8px;
                        "
                      >
                        <span style="color: #2f3440; font-weight: 600;">${data.organization_name}</span>
                        has shared
                        <span style="color: #2f3440; font-weight: 600;">${data.project_title}</span>
                        with you.
                      </div>

                      <!-- Access Duration -->
                      <div
                        class="subtitle"
                        style="
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                          font-size: 14px;
                          line-height: 20px;
                          color: #8a8f98;
                          margin: 0 0 24px;
                        "
                      >
                        You have access for ${data.access_duration}.
                      </div>

                      <!-- CTA BUTTON -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                        <tr>
                          <td align="center">
                            <a
                              href="${data.project_link}"
                              target="_blank"
                              class="btn"
                              style="
                                display: inline-block;
                                background-color: #0b63f6;
                                color: #ffffff;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                                font-size: 16px;
                                line-height: 20px;
                                font-weight: 600;
                                padding: 14px 36px;
                                border-radius: 8px;
                                text-align: center;
                              "
                            >
                              Experience now!
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FALLBACK LINK BOX -->
            <tr>
              <td align="center" style="padding: 0 16px 20px;" class="px">
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    background-color: #eef4fb;
                    border-radius: 8px;
                  "
                >
                  <tr>
                    <td style="padding: 16px 20px;">
                      <div
                        class="fallback-text"
                        style="
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                          font-size: 14px;
                          line-height: 22px;
                          color: #5a5f6a;
                          margin: 0 0 6px;
                        "
                      >
                        If the button doesn't work, copy and paste this link:
                      </div>

                      <a
                        href="${data.project_link}"
                        target="_blank"
                        class="fallback-link"
                        style="
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                          font-size: 14px;
                          line-height: 20px;
                          color: #0b63f6;
                          word-break: break-all;
                        "
                      >
                        ${data.project_link}
                      </a>
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
          <!-- /MAIN CONTAINER -->
        </td>
      </tr>
    </table>
    <!-- /FULL WIDTH WRAPPER -->
  </body>
</html>
`.trim();
